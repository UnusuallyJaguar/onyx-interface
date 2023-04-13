// FarmItemUi

/** @jsxImportSource @emotion/react */
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import { Button, TokenIcon } from 'components';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'translation';
import { Token } from 'types';
import { convertWeiToTokens, formatToReadablePercentage } from 'utilities';
import type { TransactionReceipt } from 'web3-core/types';

import { Farm, getAddress, useClaimFarmReward } from 'clients/api';
import { TOKENS } from 'constants/tokens';
import { AuthContext } from 'context/AuthContext';
import useConvertWeiToReadableTokenString from 'hooks/useConvertWeiToReadableTokenString';
import useHandleTransactionMutation from 'hooks/useHandleTransactionMutation';

import { StakeModal, WithdrawModal } from '../modals';
import { useStyles } from './styles';
import TEST_IDS from './testIds';

type ActiveModal = 'stake' | 'withdraw';

export interface FarmItemUiProps {
  onClaimReward: () => Promise<TransactionReceipt | void>;
  onStake: () => void;
  onWithdraw: () => Promise<TransactionReceipt | void>;
  closeActiveModal: () => void;
  isClaimRewardLoading: boolean;
  canWithdraw?: boolean;
  activeModal?: ActiveModal;
  className?: string;
  farm: Farm;
}

export const FarmItemUi: React.FC<FarmItemUiProps> = ({
  onClaimReward,
  onStake,
  onWithdraw,
  closeActiveModal,
  isClaimRewardLoading,
  canWithdraw = true,
  activeModal,
  className,
  farm,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const handleTransactionMutation = useHandleTransactionMutation();

  const handleClaimReward = () =>
    handleTransactionMutation({
      mutate: onClaimReward,
      successTransactionModalProps: transactionReceipt => ({
        title: t('farmItem.successfulClaimRewardTransactionModal.title'),
        content: t('farmItem.successfulClaimRewardTransactionModal.description'),
        transactionHash: transactionReceipt.transactionHash,
      }),
    });

  const handleWithdraw = () =>
    handleTransactionMutation({
      mutate: onWithdraw,
      successTransactionModalProps: transactionReceipt => ({
        title: t('farmItem.successfulWithdrawVrtTransactionModal.title'),
        content: t('farmItem.successfulWithdrawVrtTransactionModal.description'),
        transactionHash: transactionReceipt.transactionHash,
      }),
    });

  const rewardToken = TOKENS.xcn;
  const stakedToken: Token = React.useMemo(
    () => ({
      id: farm.lpSymbol,
      symbol: farm.lpSymbol,
      decimals: 18,
      address: getAddress(farm.lpAddresses),
      asset: '',
    }),
    [farm.lpSymbol],
  );

  const readableUserPendingRewardTokens = useConvertWeiToReadableTokenString({
    valueWei: farm.userData?.earnings,
    token: rewardToken,
    minimizeDecimals: true,
    addSymbol: false,
  });

  const readableUserStakedTokens = useConvertWeiToReadableTokenString({
    token: stakedToken,
    valueWei: farm.userData?.stakedBalance || new BigNumber(0),
    minimizeDecimals: true,
    addSymbol: false,
  });

  const dataListItems = useMemo(
    () => [
      {
        title: t('farmItem.stakingApr', { stakeTokenName: stakedToken.symbol }),
        value: formatToReadablePercentage(farm.farmApr),
      },
      {
        title: t('farmItem.totalStaked'),
        value: (
          <>
            <TokenIcon css={styles.tokenIcon} token={stakedToken} />
            {convertWeiToTokens({
              valueWei: farm.lpTokenBalanceMC || new BigNumber(0),
              token: stakedToken,
              returnInReadableFormat: true,
              shortenLargeValue: true,
              addSymbol: false,
            })}
          </>
        ),
      },
    ],
    [farm],
  );

  return (
    <>
      <Paper css={styles.container} className={className}>
        <div css={styles.header}>
          <div css={styles.title}>
            <TokenIcon css={styles.tokenIcon} token={stakedToken} />

            <Typography variant="h4" css={styles.text} data-testid={TEST_IDS.symbol}>
              {stakedToken.symbol}
            </Typography>
          </div>

          {farm.userData?.earnings.isGreaterThan(0) && (
            <div css={styles.rewardWrapper}>
              <Typography css={[styles.text, styles.textSmallMobile]}>
                {t('farmItem.reward')}
              </Typography>

              <TokenIcon css={[styles.tokenIcon, styles.tokenIconWithdraw]} token={rewardToken} />

              <Typography
                css={[styles.text, styles.textRewardValue, styles.textSmallMobile]}
                variant="body1"
                color="textPrimary"
                data-testid={TEST_IDS.userPendingRewardTokens}
              >
                {readableUserPendingRewardTokens}
              </Typography>

              <Button
                onClick={handleClaimReward}
                variant="text"
                css={styles.buttonClaim}
                loading={isClaimRewardLoading}
              >
                {t('farmItem.claimButton')}
              </Button>
            </div>
          )}
        </div>

        <Typography variant="small2" css={[styles.label, styles.stakingLabel]}>
          {t('farmItem.youAreStaking')}
        </Typography>

        <Typography
          variant="h1"
          css={styles.textStakingValue}
          data-testid={TEST_IDS.userStakedTokens}
        >
          <TokenIcon css={[styles.tokenIconLarge]} token={stakedToken} />

          {readableUserStakedTokens}
        </Typography>

        <ul css={styles.dataRow}>
          {dataListItems.map(({ title, value }) => (
            <li key={title} css={styles.valueWrapper}>
              <Typography variant="small2" css={[styles.label, styles.textSmallMobile]}>
                {title}
              </Typography>

              <Typography
                variant="h4"
                css={[styles.textAligned, styles.textSmallMobile]}
                data-testid={TEST_IDS.dataListItem}
              >
                {value}
              </Typography>
            </li>
          ))}
        </ul>

        <div css={styles.buttonsWrapper}>
          <Button onClick={onStake} css={styles.button} variant="primary">
            {t('farmItem.stakeButton')}
          </Button>

          {canWithdraw && (
            <Button
              onClick={handleWithdraw}
              css={styles.button}
              variant="secondary"
              loading={false}
            >
              {t('farmItem.withdrawButton')}
            </Button>
          )}
        </div>
      </Paper>

      {activeModal === 'stake' && <StakeModal farm={farm} handleClose={closeActiveModal} />}

      {activeModal === 'withdraw' && <WithdrawModal farm={farm} handleClose={closeActiveModal} />}
    </>
  );
};

export interface FarmItemProps {
  farm: Farm;
}

const FarmItem: React.FC<FarmItemProps> = ({ farm }) => {
  const { account } = useContext(AuthContext);

  const [activeModal, setActiveModal] = useState<ActiveModal | undefined>();
  const onStake = () => {
    setActiveModal('stake');
  };

  const onWithdraw = async () => {
    setActiveModal('withdraw');
  };

  const closeActiveModal = () => setActiveModal(undefined);

  const { mutateAsync: claimFarmReward, isLoading: isClaimRewardLoading } = useClaimFarmReward();
  const onClaimReward = async () =>
    claimFarmReward({
      fromAccountAddress: account?.address || '',
      pid: farm.pid,
    });
  return (
    <FarmItemUi
      onClaimReward={onClaimReward}
      isClaimRewardLoading={isClaimRewardLoading}
      onStake={onStake}
      onWithdraw={onWithdraw}
      activeModal={activeModal}
      closeActiveModal={closeActiveModal}
      canWithdraw={false}
      farm={farm}
    />
  );
};

export default FarmItem;
