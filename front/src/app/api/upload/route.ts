import { NextRequest, NextResponse } from 'next/server';
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// 0G 测试网配置
const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 直接使用/tmp目录（适用于所有部署环境）
    const tempDir = '/tmp';

    const tempFilePath = path.join(tempDir, file.name);
    fs.writeFileSync(tempFilePath, buffer);

    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
      console.error('PRIVATE_KEY environment variable not set');
      return NextResponse.json({ error: '服务器配置错误：未设置私钥环境变量' }, { status: 500 });
    }

    // 确保私钥格式正确
    let formattedPrivateKey = privateKey;
    if (!privateKey.startsWith('0x')) {
      formattedPrivateKey = '0x' + privateKey;
    }
    console.log("length:",formattedPrivateKey.length);
    
    // 验证私钥长度
    if (formattedPrivateKey.length !== 66) {
      return NextResponse.json({
        error: '私钥格式错误，应该是64位十六进制字符（不包括0x前缀）'
      }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(formattedPrivateKey, provider);
    const indexer = new Indexer(INDEXER_RPC);
    // indexer.selectNodes(0)
    const zgFile = await ZgFile.fromFilePath(tempFilePath);
    const [tree, treeErr] = await zgFile.merkleTree();

    if (treeErr) {
      fs.unlinkSync(tempFilePath);
      await zgFile.close();
      return NextResponse.json({ error: `Merkle tree错误: ${treeErr}` }, { status: 500 });
    }

    const rootHash = tree?.rootHash();

    // 解决SDK类型兼容性问题
    console.log("upload begin:",rootHash);
    // await indexer.selectNodes(2)
    const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer as any);
    console.log("upload finish:",tx);
    
    await zgFile.close();
    fs.unlinkSync(tempFilePath);

    // if (uploadErr) {
    //   return NextResponse.json({ error: `上传错误: ${uploadErr}` }, { status: 500 });
    // }

    return NextResponse.json({
      success: true,
      hash: rootHash,
      txHash: tx,
      message: '文件已成功上传到0G Storage'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: '上传过程中发生错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}