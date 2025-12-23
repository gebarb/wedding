import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export default defineEventHandler(async (event) => {
  // Ensure this is a GET request
  if (event.node.req.method !== 'GET') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
      data: 'Only GET requests are supported'
    });
  }

  const s3Config = {
    bucketName: 'ebarb-wedding', 
    region: 'us-east-2',
    cdnUrl: ''
  };

  // Initialize S3 client for public bucket
  const s3Client = new S3Client({
    region: s3Config.region,
    // For public bucket, we need to explicitly set credentials to undefined
    // and use a custom signer that doesn't require credentials
    credentials: undefined,
    // Use path style for better compatibility
    forcePathStyle: true,
    // Custom signer that bypasses the default signing process
    signer: {
      sign: async (request) => {
        // Remove any Authorization header that might be added automatically
        delete request.headers['authorization'];
        delete request.headers['Authorization'];
        return request;
      }
    },
    // Set the endpoint to the public S3 endpoint
    endpoint: `https://s3.${s3Config.region}.amazonaws.com`
  });

  try {
    // Get query parameters
    const query = getQuery(event);
    const folder = query.folder?.toString() || '';
    const page = Math.max(1, parseInt(query.page?.toString() || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(query.perPage?.toString() || '10')));
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    
    // First, list all objects to get the total count
    const listParams = {
      Bucket: s3Config.bucketName,
      Prefix: prefix,
      Delimiter: '/'
    };

    // Get all objects (we need to do this to properly paginate as S3 doesn't support offset pagination natively)
    let allObjects: any[] = [];
    let isTruncated = true;
    let nextContinuationToken: string | undefined;

    while (isTruncated) {
      const response = await s3Client.send(new ListObjectsV2Command({
        ...listParams,
        ContinuationToken: nextContinuationToken
      }));

      if (response.Contents) {
        allObjects = [...allObjects, ...response.Contents];
      }

      isTruncated = response.IsTruncated || false;
      nextContinuationToken = response.NextContinuationToken;
    }

    // Filter and sort all images
const allImages = allObjects
  .filter((file) => {
    if (!file.Key) return false;
    const extension = file.Key.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension);
  })
  .sort((a, b) => {
    if (!a.Key || !b.Key) return 0;
    
    // Extract the number from the filename (e.g., "Grand_Marlin_Proposal-1.jpg" -> 1)
    const getNumber = (key: string) => {
      const match = key.match(/-(\d+)\./);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    return getNumber(a.Key) - getNumber(b.Key);
  });

    // Calculate pagination
    const totalItems = allImages.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = Math.min(page, totalPages || 1);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalItems);
    const paginatedItems = allImages.slice(startIndex, endIndex);

    // Format the response
    const images = paginatedItems.map((file) => {
      // Use CDN URL if configured, otherwise construct the public S3 URL
      let imageUrl;
      if (s3Config.cdnUrl) {
        // Ensure there are no double slashes in the URL
        const baseUrl = s3Config.cdnUrl.endsWith('/') 
          ? s3Config.cdnUrl.slice(0, -1) 
          : s3Config.cdnUrl;
        const key = file.Key.startsWith('/') ? file.Key.slice(1) : file.Key;
        imageUrl = `${baseUrl}/${key}`;
      } else {
        // Construct direct S3 public URL
        imageUrl = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${
          file.Key.startsWith('/') ? file.Key.slice(1) : file.Key
        }`;
      }
      
      return {
        key: file.Key,
        url: imageUrl,
        lastModified: file.LastModified,
        size: file.Size,
      };
    });
    
    return {
      statusCode: 200,
      body: images,
      meta: {
        currentPage,
        perPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch images from S3: ${errorMessage}`,
    });
  }
});