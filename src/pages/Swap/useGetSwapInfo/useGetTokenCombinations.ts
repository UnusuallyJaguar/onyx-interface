import { ChainId, Token as PSToken } from '@uniswap/sdk';
import config from 'config';
import flatMap from 'lodash/flatMap';
import { useMemo } from 'react';
import { EthChainId, PSTokenCombination, Token } from 'types';

import { MAINNET_UNISWAP_TOKENS, TESTNET_UNISWAP_TOKENS } from 'constants/tokens';

import wrapToken from './wrapToken';

export interface UseGetTokenCombinationsInput {
  fromToken: Token;
  toToken: Token;
}

// List tokens to check trades against
const BASE_TRADE_TOKENS = config.isOnTestnet
  ? [TESTNET_UNISWAP_TOKENS.weth, TESTNET_UNISWAP_TOKENS.usdt, TESTNET_UNISWAP_TOKENS.uni]
  : [
      MAINNET_UNISWAP_TOKENS.weth,
      MAINNET_UNISWAP_TOKENS.uni,
      MAINNET_UNISWAP_TOKENS.usdc,
      MAINNET_UNISWAP_TOKENS.usdt,
      MAINNET_UNISWAP_TOKENS.wbtc,
      MAINNET_UNISWAP_TOKENS.usdc,
    ];

const useGetTokenCombinations = ({
  fromToken,
  toToken,
}: UseGetTokenCombinationsInput): PSTokenCombination[] =>
  useMemo(() => {
    const wrappedFromToken = wrapToken(fromToken);
    const wrappedToToken = wrapToken(toToken);

    const psFromToken = new PSToken(
      config.chainId === EthChainId.MAINNET ? ChainId.MAINNET : ChainId.GÖRLI,
      wrappedFromToken.address,
      wrappedFromToken.decimals,
      wrappedFromToken.symbol,
    );

    const psToToken = new PSToken(
      config.chainId === EthChainId.MAINNET ? ChainId.MAINNET : ChainId.GÖRLI,
      wrappedToToken.address,
      wrappedToToken.decimals,
      wrappedToToken.symbol,
    );

    // Convert tokens to UniSwap token instances
    const baseTradeTokens = [
      ...BASE_TRADE_TOKENS.map(
        token =>
          new PSToken(
            config.chainId === EthChainId.MAINNET ? ChainId.MAINNET : ChainId.GÖRLI,
            token.address,
            token.decimals,
            token.symbol,
          ),
      ),
      // Add input tokens
      psFromToken,
      psToToken,
    ];

    const baseCombinations: PSTokenCombination[] = flatMap(
      baseTradeTokens,
      (base): PSTokenCombination[] => baseTradeTokens.map(otherBase => [base, otherBase]),
    );

    const allCombinations = [
      // The direct combination
      [psFromToken, psToToken],
      // fromToken against all bases
      ...baseTradeTokens.map((token): PSTokenCombination => [psFromToken, token]),
      // toToken against all bases
      ...baseTradeTokens.map((token): PSTokenCombination => [psToToken, token]),
      // Each base against all bases
      ...baseCombinations,
    ]
      // Remove invalid combinations
      .filter((tokens): tokens is PSTokenCombination => Boolean(tokens[0] && tokens[1]))
      .filter(([t0, t1]) => t0.address !== t1.address)
      // Remove duplicates
      .reduce(
        (acc, unfilteredCombination) =>
          acc.find(
            combination =>
              (combination[0].address === unfilteredCombination[0].address &&
                combination[1].address === unfilteredCombination[1].address) ||
              (combination[0].address === unfilteredCombination[1].address &&
                combination[1].address === unfilteredCombination[0].address),
          )
            ? acc
            : [...acc, unfilteredCombination],
        [] as PSTokenCombination[],
      );

    return allCombinations;
  }, [fromToken, toToken]);

export default useGetTokenCombinations;
