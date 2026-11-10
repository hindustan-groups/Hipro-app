const ImageKit = require('imagekit');


function getImageKitInstace() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  
  if (!publicKey || !privateKey || !urlEndpoint)console.warn('Imagekit waring Mising credentails in env');


  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint
  });
}

/**
 * @param {Buffer|String} fileBuffer
 * @param {String} filename
 * @param {String} folder
 */

async function ImagekittoUpload(fileBuffer, filename,folder="/inspection") {
  const imagekit = getImageKitInstace();

  const response = await imagekit.upload({
    file:fileBuffer,
    fileName:filename || `upload_${Date.now()}.jpg`,
    folder:folder,
    useUniqueFileName:true
  });

  return  {
    fileId:response.fileId,
    url:response.url,
    thumbnailUrl:response.thumbnailUrl,
    name:response.name,
    filePath:response.filePath
  };
}

function GetAuthenticationParameters() {
  const imagekit = getImageKitInstace();
  return imagekit.getAuthenticationParameters();
};

module.exports = {
  getImageKitInstace,
  uploadToImageKit:ImagekittoUpload,
  GetAuthenticationParameters
}