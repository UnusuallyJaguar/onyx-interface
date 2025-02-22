/* eslint-disable no-nested-ternary */

/** @jsxImportSource @emotion/react */
import BigNumber from 'bignumber.js';
import {
  ApyChart,
  ApyChartProps,
  InterestRateChart,
  InterestRateChartProps,
  Spinner,
} from 'components';
import React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { useTranslation } from 'translation';
import {
  formatCentsToReadableValue,
  formatToReadablePercentage,
  formatTokensToReadableValue,
  unsafelyGetOToken,
  unsafelyGetToken,
} from 'utilities';

import { useGetOTokenApySimulations } from 'clients/api';
import Path from 'constants/path';
import PLACEHOLDER_KEY from 'constants/placeholderKey';
import { TOKENS } from 'constants/tokens';

import Card, { CardProps } from './Card';
import MarketInfo, { MarketInfoProps } from './MarketInfo';
import { useStyles } from './styles';
import TEST_IDS from './testIds';
import useGetChartData from './useGetChartData';
import useGetMarketData from './useGetMarketData';

export interface MarketDetailsUiProps {
  oTokenId: string;
  supplyChartData: ApyChartProps['data'];
  borrowChartData: ApyChartProps['data'];
  interestRateChartData: InterestRateChartProps['data'];
  totalBorrowBalanceCents?: number;
  totalSupplyBalanceCents?: number;
  borrowApyPercentage?: BigNumber;
  supplyApyPercentage?: BigNumber;
  borrowDistributionApyPercentage?: number;
  supplyDistributionApyPercentage?: number;
  tokenPriceDollars?: BigNumber;
  liquidityCents?: BigNumber;
  supplierCount?: number;
  borrowerCount?: number;
  borrowCapTokens?: BigNumber;
  supplyCapTokens?: BigNumber;
  dailyDistributionXcn?: BigNumber;
  dailySupplyingInterestsCents?: number;
  dailyBorrowingInterestsCents?: number;
  reserveFactor?: number;
  collateralFactor?: number;
  mintedTokens?: BigNumber;
  reserveTokens?: BigNumber;
  exchangeRateOTokens?: BigNumber;
  currentUtilizationRate?: number;
}

export const MarketDetailsUi: React.FC<MarketDetailsUiProps> = ({
  oTokenId,
  totalBorrowBalanceCents,
  borrowApyPercentage,
  borrowDistributionApyPercentage,
  totalSupplyBalanceCents,
  supplyApyPercentage,
  supplyDistributionApyPercentage,
  currentUtilizationRate,
  tokenPriceDollars,
  liquidityCents,
  supplierCount,
  borrowerCount,
  borrowCapTokens,
  supplyCapTokens,
  dailyDistributionXcn,
  dailySupplyingInterestsCents,
  dailyBorrowingInterestsCents,
  reserveTokens,
  reserveFactor,
  collateralFactor,
  mintedTokens,
  exchangeRateOTokens,
  supplyChartData,
  borrowChartData,
  interestRateChartData,
}) => {
  const { t } = useTranslation();
  const styles = useStyles();

  const token = unsafelyGetToken(oTokenId);
  const oToken = unsafelyGetOToken(oTokenId);

  const supplyInfoStats: CardProps['stats'] = React.useMemo(
    () => [
      {
        label: t('marketDetails.supplyInfo.stats.totalSupply'),
        value: formatCentsToReadableValue({
          value: totalSupplyBalanceCents,
          shortenLargeValue: true,
        }),
      },
      {
        label: t('marketDetails.supplyInfo.stats.apy'),
        value: formatToReadablePercentage(supplyApyPercentage),
      },
      {
        label: t('marketDetails.supplyInfo.stats.distributionApy'),
        value: formatToReadablePercentage(supplyDistributionApyPercentage),
      },
    ],
    [totalSupplyBalanceCents?.toFixed(), supplyApyPercentage, supplyDistributionApyPercentage],
  );

  const supplyInfoLegends: CardProps['legends'] = [
    {
      label: t('marketDetails.legends.supplyApy'),
      color: styles.legendColors.supplyApy,
    },
  ];

  const borrowInfoStats: CardProps['stats'] = React.useMemo(
    () => [
      {
        label: t('marketDetails.borrowInfo.stats.totalBorrow'),
        value: formatCentsToReadableValue({
          value: totalBorrowBalanceCents,
          shortenLargeValue: true,
        }),
      },
      {
        label: t('marketDetails.borrowInfo.stats.apy'),
        value: borrowApyPercentage?.gt(0)
          ? `-${formatToReadablePercentage(borrowApyPercentage)}`
          : '0%',
      },
      {
        label: t('marketDetails.borrowInfo.stats.distributionApy'),
        value: formatToReadablePercentage(borrowDistributionApyPercentage),
      },
    ],
    [totalBorrowBalanceCents?.toFixed(), borrowApyPercentage, borrowDistributionApyPercentage],
  );

  const borrowInfoLegends: CardProps['legends'] = [
    {
      label: t('marketDetails.legends.borrowApy'),
      color: styles.legendColors.borrowApy,
    },
  ];

  const interestRateModelLegends: CardProps['legends'] = [
    {
      label: t('marketDetails.legends.utilizationRate'),
      color: styles.legendColors.utilizationRate,
    },
    {
      label: t('marketDetails.legends.borrowApy'),
      color: styles.legendColors.borrowApy,
    },
    {
      label: t('marketDetails.legends.supplyApy'),
      color: styles.legendColors.supplyApy,
    },
  ];

  const marketInfoStats: MarketInfoProps['stats'] = React.useMemo(
    () => [
      {
        label: t('marketDetails.marketInfo.stats.priceLabel'),
        value:
          tokenPriceDollars === undefined
            ? PLACEHOLDER_KEY
            : token.symbol === 'SHIB'
            ? `$${tokenPriceDollars.toFormat(6)}`
            : token.symbol === 'XCN'
            ? `$${tokenPriceDollars.toFormat(4)}`
            : `$${tokenPriceDollars.toFormat(2)}`,
      },
      {
        label: t('marketDetails.marketInfo.stats.marketLiquidityLabel'),
        value: formatCentsToReadableValue({
          value: liquidityCents,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.supplierCountLabel'),
        value: supplierCount ?? '-',
      },
      {
        label: t('marketDetails.marketInfo.stats.borrowerCountLabel'),
        value: borrowerCount ?? '-',
      },
      {
        label: t('marketDetails.marketInfo.stats.supplyCapLabel'),
        value: supplyCapTokens?.isEqualTo(0)
          ? t('marketDetails.marketInfo.stats.unlimitedSupplyCap')
          : formatTokensToReadableValue({
              value: supplyCapTokens,
              minimizeDecimals: true,
              token,
            }),
      },
      {
        label: t('marketDetails.marketInfo.stats.borrowCapLabel'),
        value: borrowCapTokens?.isEqualTo(0)
          ? t('marketDetails.marketInfo.stats.unlimitedBorrowCap')
          : formatTokensToReadableValue({
              value: borrowCapTokens,
              minimizeDecimals: true,
              token,
            }),
      },
      {
        label: t('marketDetails.marketInfo.stats.dailySupplyingInterestsLabel'),
        value: formatCentsToReadableValue({
          value: dailySupplyingInterestsCents,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.dailyBorrowingInterestsLabel'),
        value: formatCentsToReadableValue({
          value: dailyBorrowingInterestsCents,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.dailyDistributionXcn'),
        value: formatTokensToReadableValue({
          value: dailyDistributionXcn,
          minimizeDecimals: true,
          addSymbol: false,
          token: TOKENS.xcn,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.reserveTokensLabel'),
        value: formatTokensToReadableValue({
          value: reserveTokens,
          minimizeDecimals: true,
          token,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.reserveFactorLabel'),
        value: formatToReadablePercentage(reserveFactor),
      },
      {
        label: t('marketDetails.marketInfo.stats.collateralFactorLabel'),
        value: formatToReadablePercentage(collateralFactor),
      },
      {
        label: t('marketDetails.marketInfo.stats.mintedTokensLabel', {
          oTokenSymbol: oToken.symbol,
        }),
        value: formatTokensToReadableValue({
          value: mintedTokens,
          minimizeDecimals: true,
          addSymbol: false,
          token,
        }),
      },
      {
        label: t('marketDetails.marketInfo.stats.exchangeRateLabel'),
        value: exchangeRateOTokens
          ? t('marketDetails.marketInfo.stats.exchangeRateValue', {
              tokenSymbol: token.symbol,
              oTokenSymbol: oToken.symbol,
              rate: exchangeRateOTokens.dp(6).toFixed(),
            })
          : PLACEHOLDER_KEY,
      },
    ],
    [
      tokenPriceDollars,
      liquidityCents?.toFixed(),
      supplierCount,
      borrowerCount,
      borrowCapTokens?.toFixed(),
      supplyCapTokens?.toFixed(),
      dailySupplyingInterestsCents,
      dailyBorrowingInterestsCents,
      dailyDistributionXcn?.toFixed(),
      reserveTokens?.toFixed(),
      oTokenId,
      reserveFactor?.toFixed(),
      collateralFactor?.toFixed(),
      mintedTokens?.toFixed(),
      exchangeRateOTokens?.toFixed(),
    ],
  );

  if (!supplyChartData.length || !borrowChartData.length || !interestRateChartData.length) {
    return <Spinner />;
  }

  // @TODO: handle fetching errors

  return (
    <div css={styles.container}>
      <div css={[styles.column, styles.graphsColumn]}>
        <Card
          testId={TEST_IDS.supplyInfo}
          title={t('marketDetails.supplyInfo.title')}
          css={styles.graphCard}
          stats={supplyInfoStats}
          legends={supplyInfoLegends}
        >
          <div css={styles.apyChart}>
            <ApyChart data={supplyChartData} type="supply" />
          </div>
        </Card>

        <Card
          testId={TEST_IDS.borrowInfo}
          title={t('marketDetails.borrowInfo.title')}
          css={styles.graphCard}
          stats={borrowInfoStats}
          legends={borrowInfoLegends}
        >
          <div css={styles.apyChart}>
            <ApyChart data={borrowChartData} type="borrow" />
          </div>
        </Card>

        <Card
          testId={TEST_IDS.interestRateModel}
          title={t('marketDetails.interestRateModel.title')}
          css={styles.graphCard}
          legends={interestRateModelLegends}
        >
          <div css={styles.apyChart}>
            <InterestRateChart
              data={interestRateChartData}
              currentUtilizationRate={currentUtilizationRate}
            />
          </div>
        </Card>
      </div>

      <div css={[styles.column, styles.statsColumn, styles.marketInfo]}>
        <MarketInfo stats={marketInfoStats} testId={TEST_IDS.marketInfo} />
      </div>
    </div>
  );
};

export type MarketDetailsProps = RouteComponentProps<{ oTokenId: string }>;

const MarketDetails: React.FC<MarketDetailsProps> = ({
  match: {
    params: { oTokenId },
  },
}) => {
  const oToken = unsafelyGetOToken(oTokenId);

  // Redirect to market page if oTokenId passed through route params is invalid
  if (!oToken) {
    return <Redirect to={Path.MARKETS} />;
  }

  const { reserveFactorMantissa, ...marketData } = useGetMarketData({
    oTokenId,
  });

  const chartData = useGetChartData({
    oTokenId,
  });

  const {
    data: interestRateChartData = {
      apySimulations: [],
    },
  } = useGetOTokenApySimulations({
    oTokenId,
    reserveFactorMantissa,
  });

  return (
    <MarketDetailsUi
      oTokenId={oTokenId}
      {...marketData}
      {...chartData}
      interestRateChartData={interestRateChartData.apySimulations}
    />
  );
};

export default MarketDetails;
