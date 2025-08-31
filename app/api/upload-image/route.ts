import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    // Get Cloudinary cloud name from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
        { status: 500 }
      )
    }

    // Create form data for unsigned upload
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', dataURI)
    cloudinaryFormData.append('upload_preset', 'ml_default') // Use default preset
    cloudinaryFormData.append('folder', 'profile-images')

    // Upload to Cloudinary using unsigned upload
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    })

    const uploadData = await uploadResponse.json()
    
    if (!uploadResponse.ok) {
      console.error('Cloudinary error:', uploadData)
      throw new Error(uploadData.error?.message || 'Upload failed')
    }

    return NextResponse.json({ 
      url: uploadData.secure_url,
      publicId: uploadData.public_id 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Image upload failed' },
      { status: 500 }
    )
  }
} 