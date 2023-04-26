import { MutationObserverOptions, useMutation } from 'react-query';
import { Token } from 'types';

import { ApproveTokenInput, ApproveTokenOutput, approveToken, queryClient } from 'clients/api';
import { useTokenContract } from 'clients/contracts/hooks';
import FunctionKey from 'constants/functionKey';

import setCachedTokenAllowanceToMax from '../../queries/getAllowance/setCachedTokenAllowanceToMax';

const useApproveToken = (
  { token, farmRefresh }: { token: Token; farmRefresh?: boolean },
  // TODO: use custom error type https://app.clickup.com/t/2rvwhnt
  options?: MutationObserverOptions<
    ApproveTokenOutput,
    Error,
    Omit<ApproveTokenInput, 'tokenContract'>
  >,
) => {
  const tokenContract = useTokenContract(token);

  return useMutation(
    [FunctionKey.APPROVE_TOKEN, { token }],
    params =>
      approveToken({
        tokenContract,
        ...params,
      }),
    {
      ...options,
      onSuccess: (...onSuccessParams) => {
        const { spenderAddress, accountAddress } = onSuccessParams[1];
        setCachedTokenAllowanceToMax({ queryClient, token, spenderAddress, accountAddress });

        if (farmRefresh) {
          // Invalidate cached farm data
          queryClient.invalidateQueries([FunctionKey.GET_FARMS, accountAddress]);
        }

        if (options?.onSuccess) {
          options.onSuccess(...onSuccessParams);
        }
      },
    },
  );
};

export default useApproveToken;
