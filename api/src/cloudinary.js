// Upload de archivos a Cloudinary (sin SDK, solo fetch)
const crypto = require('crypto');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dkoocok3j';
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

async function subirPDF(pdfBuffer, nombreArchivo) {
  try {
    const base64Data = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'contratos';
    const publicId = `${folder}/${nombreArchivo}`;

    // Generar firma (Cloudinary requiere firma para uploads autenticados)
    const signString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signString).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    formData.append('resource_type', 'raw');

    const resp = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
      { method: 'POST', body: formData }
    );

    const data = await resp.json();

    if (data.secure_url) {
      console.log(`Cloudinary upload OK: ${data.secure_url}`);
      return data.secure_url;
    } else {
      console.error('Cloudinary error:', JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error('Error subiendo a Cloudinary:', err.message);
    return null;
  }
}

module.exports = { subirPDF };
