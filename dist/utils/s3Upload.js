"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBase64Image = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({
    endpoint: 'https://pamobniywbuloarioxiu.storage.supabase.co/storage/v1/s3',
    region: 'ap-northeast-1',
    credentials: {
        accessKeyId: '587500859beeb248c8e195a2de262677',
        secretAccessKey: '013a68865f89786abf864f9880579660da6709d1d0c94e73edda213ef7c2a954',
    },
    forcePathStyle: true,
});
const uploadBase64Image = async (base64String, bucketName = 'logos') => {
    // Parse base64
    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format. Must be a valid data URI image.');
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const fileExt = contentType.split('/')[1] || 'png';
    const fileName = `hospital-logo-${Date.now()}.${fileExt}`;
    // Ensure bucket exists
    try {
        await s3.send(new client_s3_1.HeadBucketCommand({ Bucket: bucketName }));
    }
    catch (err) {
        try {
            console.log(`Bucket ${bucketName} not found, attempting to create...`);
            await s3.send(new client_s3_1.CreateBucketCommand({ Bucket: bucketName }));
        }
        catch (createErr) {
            console.warn('Bucket creation warning (bucket may already exist or require pre-creation):', createErr);
        }
    }
    // Upload object
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
    }));
    // Return public URL
    return `https://pamobniywbuloarioxiu.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
};
exports.uploadBase64Image = uploadBase64Image;
//# sourceMappingURL=s3Upload.js.map