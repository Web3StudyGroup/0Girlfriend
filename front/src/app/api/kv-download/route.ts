import { NextRequest, NextResponse } from 'next/server';
import { Indexer, KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
const KV_CLIENT_URL = 'http://3.101.147.150:6789';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const streamId = searchParams.get('streamId');

    if (!key) {
      return NextResponse.json({ error: 'Key参数必须提供' }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json({ error: '未配置私钥' }, { status: 500 });
    }

    // 确保私钥格式正确
    let formattedPrivateKey = privateKey;
    if (!privateKey.startsWith('0x')) {
      formattedPrivateKey = '0x' + privateKey;
    }

    // 验证私钥长度
    if (formattedPrivateKey.length !== 66) {
      return NextResponse.json({
        error: '私钥格式错误，应该是64位十六进制字符（不包括0x前缀）'
      }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(formattedPrivateKey, provider);
    const indexer = new Indexer(INDEXER_RPC);

    // 使用提供的streamId，如果没有提供则使用默认值
    const actualStreamId = streamId || '0x00000000000000000000000000000000000000000000000000000000000001';

    console.log('KV Storage retrieval request:', { key, streamId: actualStreamId });

    try {
      // 使用KvClient从0G-KV读取数据
      const kvClient = new KvClient(KV_CLIENT_URL);
      const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));

      console.log('Attempting to retrieve KV data:', {
        key,
        streamId: actualStreamId,
        kvClientUrl: KV_CLIENT_URL
      });

      // 从KV存储读取数据
      const value = await kvClient.getValue(actualStreamId, keyBytes);

      if (value) {
        // 根据文档，getValue返回的value可以直接使用
        const decodedValue = value;

        return NextResponse.json({
          success: true,
          key: key,
          value: decodedValue,
          streamId: actualStreamId,
          message: '数据已成功从0G Key-Value Storage获取'
        });
      } else {
        return NextResponse.json({
          success: false,
          key: key,
          streamId: actualStreamId,
          message: '未找到指定的Key-Value数据',
          note: '请确保Key存在且StreamID正确'
        }, { status: 404 });
      }

    } catch (kvError) {
      console.error('KV读取错误:', kvError);
      return NextResponse.json({
        error: `Key-Value读取错误: ${kvError instanceof Error ? kvError.message : '未知错误'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('KV Download error:', error);
    return NextResponse.json(
      { error: `Key-Value下载过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}