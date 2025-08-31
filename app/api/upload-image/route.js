"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const formData = yield req.formData();
            const file = formData.get('file');
            if (!file) {
                return server_1.NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }
            // Convert file to base64
            const bytes = yield file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString('base64');
            const dataURI = `data:${file.type};base64,${base64}`;
            // Get Cloudinary cloud name from environment
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                return server_1.NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 });
            }
            // Create form data for unsigned upload
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append('file', dataURI);
            cloudinaryFormData.append('upload_preset', 'ml_default'); // Use default preset
            cloudinaryFormData.append('folder', 'profile-images');
            // Upload to Cloudinary using unsigned upload
            const uploadResponse = yield fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: cloudinaryFormData,
            });
            const uploadData = yield uploadResponse.json();
            if (!uploadResponse.ok) {
                console.error('Cloudinary error:', uploadData);
                throw new Error(((_a = uploadData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Upload failed');
            }
            return server_1.NextResponse.json({
                url: uploadData.secure_url,
                publicId: uploadData.public_id
            });
        }
        catch (error) {
            console.error('Upload error:', error);
            return server_1.NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
        }
    });
}
