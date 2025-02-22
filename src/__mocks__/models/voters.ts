import { GetVotersApiResponse } from 'clients/api/queries/getVoters';
import formatToVoters from 'clients/api/queries/getVoters/formatToVoters';

import votersResponse from '../api/voters.json';

const voters = formatToVoters(votersResponse as GetVotersApiResponse);

export default voters;
