import { NextRequest, NextResponse } from 'next/server';
import { Indexer } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

// 0G 测试网配置
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let rootHash = searchParams.get('hash');

    if (!rootHash) {
      return NextResponse.json({ error: '请提供rootHash' }, { status: 400 });
    }

    // 确保rootHash格式正确（移除0x前缀如果存在）
    if (rootHash.startsWith('0x')) {
      rootHash = rootHash.slice(2);
    }

    console.log('开始下载文件，原始hash:', searchParams.get('hash'));
    console.log('处理后rootHash:', rootHash);

    const indexer = new Indexer(INDEXER_RPC);

    // 直接使用/tmp目录（适用于所有部署环境）
    const tempDir = '/tmp';

    const downloadPath = path.join(tempDir, `download_${Date.now()}.tmp`);

    console.log('下载路径:', downloadPath);

    try {
      // 添加超时处理
      const downloadPromise = indexer.download(rootHash, downloadPath, true);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('下载超时')), 10000)
      );

      const err = await Promise.race([downloadPromise, timeoutPromise]);

      if (err) {
        console.error('下载错误:', err);
        // 返回404而不是500，这样前端可以显示默认头像
        return NextResponse.json({ error: `下载错误: ${err}` }, { status: 404 });
      }
    } catch (error) {
      console.error('下载过程异常:', error);
      // 返回404让前端显示默认头像
      return NextResponse.json({ error: `下载过程异常: ${error}` }, { status: 404 });
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