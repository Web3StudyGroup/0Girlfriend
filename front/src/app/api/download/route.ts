import { NextRequest, NextResponse } from 'next/server';
import { Indexer } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

// 0G 测试网配置
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

export async function POST(request: NextRequest) {
  try {
    const { rootHash } = await request.json();

    if (!rootHash) {
      return NextResponse.json({ error: '请提供rootHash' }, { status: 400 });
    }

    const indexer = new Indexer(INDEXER_RPC);

    // 直接使用/tmp目录（适用于所有部署环境）
    const tempDir = '/tmp';

    const downloadPath = path.join(tempDir, `download_${Date.now()}.tmp`);

    console.log('开始下载文件，rootHash:', rootHash);
    console.log('下载路径:', downloadPath);

    const err = await indexer.download(rootHash, downloadPath, true);

    if (err) {
      console.error('下载错误:', err);
      return NextResponse.json({ error: `下载错误: ${err}` }, { status: 500 });
    }

    if (!fs.existsSync(downloadPath)) {
      return NextResponse.json({ error: '下载的文件不存在' }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(downloadPath);
    fs.unlinkSync(downloadPath);

    const fileExtension = getFileExtension(fileBuffer);
    const mimeType = getMimeType(fileExtension);

    console.log('下载成功，文件大小:', fileBuffer.length, 'bytes');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="downloaded_image.${fileExtension}"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: '下载过程中发生错误' },
      { status: 500 }
    );
  }
}

function getFileExtension(buffer: Buffer): string {
  const uint8Array = new Uint8Array(buffer.slice(0, 8));

  if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
    return 'jpg';
  }

  if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
    return 'png';
  }

  if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
    return 'gif';
  }

  if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
    return 'webp';
  }

  return 'jpg';
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };

  return mimeTypes[extension] || 'image/jpeg';
}