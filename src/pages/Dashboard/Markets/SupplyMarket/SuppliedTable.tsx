/** @jsxImportSource @emotion/react */
import { LayeredValues, Table, TableProps, Toggle, TokenIconWithSymbol } from 'components';
import React, { useMemo } from 'react';
import { useTranslation } from 'translation';
import { Asset } from 'types';
import {
  formatCentsToReadableValue,
  formatToReadablePercentage,
  formatTokensToReadableValue,
} from 'utilities';

import PLACEHOLDER_KEY from 'constants/placeholderKey';

import { useStyles as useSharedStyles } from '../styles';
import { useStyles } from './styles';

export interface SuppliedTableUiProps {
  assets: Asset[];
  isXcnEnabled: boolean;
  rowOnClick: (e: React.MouseEvent<HTMLElement>, row: TableProps['data'][number]) => void;
  collateralOnChange: (asset: Asset) => void;
}

export const SuppliedTable: React.FC<SuppliedTableUiProps> = ({
  assets,
  isXcnEnabled,
  collateralOnChange,
  rowOnClick,
}) => {
  const { t } = useTranslation();
  const styles = useStyles();
  const sharedStyles = useSharedStyles();

  const columns = useMemo(
    () => [
      { key: 'asset', label: t('markets.columns.asset'), orderable: false, align: 'left' },
      { key: 'apy', label: t('markets.columns.apy'), orderable: true, align: 'right' },
      { key: 'balance', label: t('markets.columns.balance'), orderable: true, align: 'right' },
      {
        key: 'collateral',
        label: t('markets.columns.collateral'),
        orderable: true,
        align: 'right',
      },
    ],
    [],
  );

  // Format assets to rows
  const rows: TableProps['data'] = assets.map(asset => {
    const supplyApy = isXcnEnabled ? asset.xcnSupplyApy.plus(asset.supplyApy) : asset.supplyApy;
    return [
      {
        key: 'asset',
        render: () => <TokenIconWithSymbol token={asset.token} />,
        value: asset.token.id,
        align: 'left',
      },
      {
        key: 'apy',
        render: () =>
          asset.xcnSupplyApy.isNaN() ? (
            'Pending'
          ) : (
            <span style={{ color: '#18DF8B' }}>{formatToReadablePercentage(supplyApy)}</span>
          ),
        value: asset.supplyApy.toFixed(),
        align: 'right',
      },
      {
        key: 'balance',
        render: () => (
          <LayeredValues
            topValue={formatCentsToReadableValue({
              value: asset.supplyBalance.multipliedBy(asset.tokenPrice).multipliedBy(100),
              shortenLargeValue: true,
            })}
            bottomValue={formatTokensToReadableValue({
              value: asset.supplyBalance,
              token: asset.token,
              shortenLargeValue: true,
            })}
          />
        ),
        value: asset.supplyBalance.toFixed(),
        align: 'right',
      },
      {
        key: 'collateral',
        render: () =>
          asset.collateralFactor.toNumber() || asset.collateral ? (
            <Toggle onChange={() => collateralOnChange(asset)} value={asset.collateral} />
          ) : (
            PLACEHOLDER_KEY
          ),
        value: asset.collateral,
        align: 'right',
      },
    ];
  });

  return (
    <Table
      title={t('markets.suppliedTableTitle')}
      columns={columns}
      data={rows}
      // initialOrder={{
      //   orderBy: 'apy',
      //   orderDirection: 'desc',
      // }}
      rowOnClick={rowOnClick}
      rowKeyIndex={0}
      tableCss={sharedStyles.table}
      cardsCss={sharedStyles.cards}
      css={[sharedStyles.marketTable, styles.cardContentGrid]}
    />
  );
};

export default SuppliedTable;
