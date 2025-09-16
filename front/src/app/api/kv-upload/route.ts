import { NextRequest, NextResponse } from 'next/server';
import { Indexer, Batcher,getFlowContract } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

export async function POST(request: NextRequest) {
  try {
    const { key, value, streamId } = await request.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Key和Value参数必须提供' }, { status: 400 });
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

    // 使用提供的streamId，如果没有提供则使用默认值（简化的streamId）
    const actualStreamId = streamId || '0x00000000000000000000000000000000000000000000000000000000000001';

    console.log('KV Storage request:', { key, value, streamId: actualStreamId });

    // 选择存储节点
    const [nodes, nodeErr] = await indexer.selectNodes(1);
    if (nodeErr !== null) {
      return NextResponse.json({ error: `节点选择错误: ${nodeErr}` }, { status: 500 });
    }

    console.log('Selected nodes for KV storage:', nodes.length);

    // 创建流合约实例
    const flowContractAddress = '0xbD75117F80b4E22698D0Cd7612d92BDb8eaff628';
    // const flowContractABI = [
    //   "function submit(bytes calldata data) external"
    // ];

    // const flowContract = new ethers.Contract(
    //   flowContractAddress,
    //   flowContractABI,
    //   signer
    // );
    const flowContract = getFlowContract(flowContractAddress, signer as any);
    // 创建Batcher实例 - 修正参数
    const batcher = new Batcher(0, nodes, flowContract, RPC_URL);

    // 将key和value转换为字节数组
    const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
    const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));

    console.log('Key bytes length:', keyBytes.length, 'Value bytes length:', valueBytes.length);

    // 使用streamDataBuilder设置KV数据
    if (!batcher.streamDataBuilder) {
      return NextResponse.json({ error: 'Batcher streamDataBuilder未正确初始化' }, { status: 500 });
    }

    // 设置Key-Value数据到指定的stream
    batcher.streamDataBuilder.set(actualStreamId, keyBytes, valueBytes);

    console.log('Data set in streamDataBuilder, executing batch...');

    // 执行批量上传
    const [tx, batchErr] = await batcher.exec();
    if (batchErr !== null) {
      console.error('Batch execution error:', batchErr);
      return NextResponse.json({ error: `批量执行错误: ${batchErr}` }, { status: 500 });
    }

    console.log('KV storage successful, tx:', tx);

    return NextResponse.json({
      success: true,
      txHash: tx,
      key: key,
      value: value,
      streamId: actualStreamId,
      message: '数据已成功存储到0G Key-Value Storage'
    });

  } catch (error) {
    console.error('KV Upload error:', error);
    return NextResponse.json(
      { error: `Key-Value上传过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}