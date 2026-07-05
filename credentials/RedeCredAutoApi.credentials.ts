import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RedeCredAutoApi implements ICredentialType {
	name = 'redeCredAutoApi';

	displayName = 'RedeCredAuto API';

	documentationUrl = 'https://api.negativardevedores.com.br';

	properties: INodeProperties[] = [
		{
			displayName: 'Ambiente',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Produção',
					value: 'prod',
					description: 'Ambiente de produção (dados reais)',
				},
				{
					name: 'Homologação (UAT)',
					value: 'uat',
					description: 'Ambiente de testes com contratos/documentos fixos',
				},
			],
			default: 'uat',
			description: 'Ambiente da API a ser utilizado. Define o prefixo /prod ou /uat da URL.',
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Token Bearer fornecido pela RedeCredAuto para o ambiente selecionado',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "prod" ? "https://api.negativardevedores.com.br/prod" : "https://api.negativardevedores.com.br/uat"}}',
			url: '/auth-test',
			method: 'GET',
		},
	};
}
