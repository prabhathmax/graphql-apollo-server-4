const AWS = require('aws-sdk');
const { pickBy } = require('lodash');

function getS3(region = null) {
    const credentials = process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
        : null;

    const options = pickBy(
        {
            region: region || process.env.S3_REGION || process.env.AWS_REGION,
            credentials,
        },
        Boolean,
    );

    return new AWS.S3(options);
}

exports.uploadFileToS3UsingStream = async (
    contentType,
    fileExtension,
    stream,
    { bucket, region, path },
    fileName,
) => {
    const s3 = getS3(region);
    const params = {
        Bucket: bucket,
        contentType,
        Key: `${path}/${fileName}.${fileExtension}`,
        Body: stream,
        ACL: 'public-read',
    };

    await s3.upload(params).promise();
    return {
        url: `https://s3.us-west-2.amazonaws.com/${bucket}/${path}/${fileName}.${fileExtension}`,
    };
};
