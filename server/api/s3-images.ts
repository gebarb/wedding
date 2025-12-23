import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Debug function to log request details
function logRequestInfo(event: any, message: string, data?: any) {
  const requestId = event.node.req.headers['x-request-id'] || 'no-request-id';
  const logData = {
    timestamp: new Date().toISOString(),
    requestId,
    path: event.node.req.url,
    method: event.node.req.method,
    message,
    ...(data && { data })
  };
  console.log(JSON.stringify(logData, null, 2));
}

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
    credentials: undefined, // For public bucket
    signer: {
      sign: (requestToSign) => {
        logRequestInfo(event, 'S3 Signing Request', {
          url: requestToSign.protocol + '//' + requestToSign.hostname + requestToSign.path,
          method: requestToSign.method,
          headers: Object.keys(requestToSign.headers).reduce((acc, key) => {
            // Don't log sensitive headers
            if (key.toLowerCase() === 'authorization') {
              acc[key] = '***REDACTED***';
            } else {
              acc[key] = requestToSign.headers[key];
            }
            return acc;
          }, {} as Record<string, any>)
        });
        return Promise.resolve(requestToSign);
      }
    },
  });
  
  logRequestInfo(event, 'S3 Client Initialized', {
    region: s3Config.region,
    bucketName: s3Config.bucketName,
    hasCdn: !!s3Config.cdnUrl
  });

  try {
    // Log incoming request
    logRequestInfo(event, 'Request received', {
      url: event.node.req.url,
      headers: event.node.req.headers,
      query: event.node.req.url?.split('?')[1] || 'none'
    });
    
    // Get query parameters
    const query = getQuery(event);
    const folder = query.folder?.toString() || '';
    const page = Math.max(1, parseInt(query.page?.toString() || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(query.perPage?.toString() || '10')));
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    
    logRequestInfo(event, 'Query parameters processed', {
      folder,
      page,
      perPage,
      prefix
    });
    
    // First, list all objects to get the total count
    const listParams = {
      Bucket: s3Config.bucketName,
      Prefix: prefix,
      Delimiter: '/',
      MaxKeys: 1000
    };
    
    logRequestInfo(event, 'S3 ListObjectsV2 params', listParams);

    // Get all objects (we need to do this to properly paginate as S3 doesn't support offset pagination natively)
    let allObjects: any[] = [];
    let isTruncated = true;
    let nextContinuationToken: string | undefined;
    let requestCount = 0;

    while (isTruncated) {
      requestCount++;
      let response;
      try {
        logRequestInfo(event, `S3 Request #${requestCount}`, {
          continuationToken: !!nextContinuationToken ? 'present' : 'none'
        });
        
        response = await s3Client.send(new ListObjectsV2Command({
          ...listParams,
          ContinuationToken: nextContinuationToken
        }));
        
        logRequestInfo(event, `S3 Response #${requestCount}`, {
          keyCount: response.KeyCount,
          isTruncated: response.IsTruncated,
          objectCount: response.Contents?.length || 0
        });

        if (response.Contents) {
          allObjects = [...allObjects, ...response.Contents];
        }

        isTruncated = response.IsTruncated || false;
        nextContinuationToken = response.NextContinuationToken;
      } catch (error: any) {
        logRequestInfo(event, 'S3 Request Failed', {
          error: error.message,
          code: error.code,
          requestId: error.$metadata?.requestId,
          attempt: requestCount
        });
        throw error;
      }
    }

    logRequestInfo(event, 'S3 List Complete', {
      totalObjects: allObjects.length,
      requestCount
    });

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
    
    logRequestInfo(event, 'Pagination Complete', {
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage: perPage,
      startIndex,
      endIndex,
      itemsInPage: paginatedItems.length
    });

    // Format the response
    const images = paginatedItems.map((file) => {
      const imageUrl = s3Config.cdnUrl 
        ? `${s3Config.cdnUrl}/${file.Key}`
        : `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${file.Key}`;
      
      return {
        key: file.Key,
        url: imageUrl,
        lastModified: file.LastModified,
        size: file.Size,
      };
    });
    
    const response = {
      statusCode: 200,
      body: images,
      meta: {
        currentPage,
        totalPages,
        totalItems,
        perPage
      }
    };
    
    logRequestInfo(event, 'Sending Response', {
      statusCode: 200,
      itemCount: images.length
    });
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logRequestInfo(event, 'Error processing request', {
      error: errorMessage,
      stack: errorStack,
      statusCode: 500
    });
    
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch images from S3',
      data: errorMessage
    });
  }
});