import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { 
  S3_BUCKET_NAME,
  S3_REGION,
  S3_CDN_URL,
  S3_MAX_ITEMS_PER_PAGE,
  S3_DEFAULT_ITEMS_PER_PAGE,
  S3_ERROR_METHOD_NOT_ALLOWED,
  S3_ERROR_ONLY_GET_ALLOWED,
  S3_ERROR_FETCH_FAILED,
  S3_DEFAULT_FOLDER,
  S3_DEFAULT_PAGE
} from '~/util/constants';

export default defineEventHandler(async (event) => {
  // Ensure this is a GET request
  if (event.node.req.method !== 'GET') {
    return createError({
      statusCode: 405,
      statusMessage: S3_ERROR_METHOD_NOT_ALLOWED,
      data: S3_ERROR_ONLY_GET_ALLOWED
    });
  }

  // Initialize S3 client for public bucket
  const s3Client = new S3Client({
    region: S3_REGION,
    credentials: { accessKeyId: "", secretAccessKey: "" },
    signer: { sign: async req => req },
  });

  try {
    // Get query parameters with defaults from constants
    const query = getQuery(event);
    const folder = query.folder?.toString() || S3_DEFAULT_FOLDER;
    const page = Math.max(S3_DEFAULT_PAGE, parseInt(query.page?.toString() || S3_DEFAULT_PAGE.toString()));
    const perPage = Math.min(
      S3_MAX_ITEMS_PER_PAGE, 
      Math.max(1, parseInt(query.perPage?.toString() || S3_DEFAULT_ITEMS_PER_PAGE.toString()))
    );
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    
    // List objects parameters
    const listParams = {
      Bucket: S3_BUCKET_NAME,
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
      // Encode each part of the key separately to handle special characters
      const encodedKey = file.Key.split('/').map(encodeURIComponent).join('/');
      const imageUrl = S3_CDN_URL 
        ? `${S3_CDN_URL}/${encodedKey}`
        : `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${encodedKey}`;
      
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
    console.error('S3 Error:', errorMessage);
    
    throw createError({
      statusCode: 500,
      statusMessage: `${S3_ERROR_FETCH_FAILED}: ${errorMessage}`,
    });
  }
});