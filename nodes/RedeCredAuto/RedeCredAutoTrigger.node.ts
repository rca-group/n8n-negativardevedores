import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

export class RedeCredAutoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RedeCredAuto Trigger',
		name: 'redeCredAutoTrigger',
		icon: 'file:redecredauto.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '=Webhook: {{$parameter["eventos"].join(", ") || "todos"}}',
		description: 'Recebe notificações de webhook da API de Negativação da RedeCredAuto',
		defaults: {
			name: 'RedeCredAuto Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'redecredauto',
			},
		],
		properties: [
			{
				displayName:
					'Cole a <b>Production URL</b> abaixo no campo <code>webhook_url</code> ao enviar a Inclusão para a RedeCredAuto. A API fará um POST nessa URL a cada mudança de status.',
				name: 'aviso',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Filtrar Por Situação',
				name: 'eventos',
				type: 'multiOptions',
				description:
					'Se informado, apenas notificações cujo campo "situacao" esteja na lista disparam o workflow. Vazio = todas.',
				options: [
					{ name: 'Desconhecido', value: 'desconhecido' },
					{ name: 'Erro', value: 'erro' },
					{ name: 'Inconsistência', value: 'inconsistencia' },
					{ name: 'Pendente', value: 'pendente' },
					{ name: 'Processado', value: 'processado' },
					{ name: 'Processando', value: 'processando' },
				],
				default: [],
			},
			{
				displayName: 'Opções',
				name: 'opcoes',
				type: 'collection',
				placeholder: 'Adicionar opção',
				default: {},
				options: [
					{
						displayName: 'Token De Verificação',
						name: 'verificationToken',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description:
							'Se preenchido, o node só aceita requisições que enviem este valor no header "X-Webhook-Token" (ou query "token"). Requisições sem o token correto são rejeitadas com 401.',
					},
					{
						displayName: 'Nome Do Header',
						name: 'headerName',
						type: 'string',
						default: 'x-webhook-token',
						description: 'Nome do header onde o valor de verificação é esperado (minúsculas)',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headers = this.getHeaderData() as IDataObject;
		const query = this.getQueryData() as IDataObject;
		const body = this.getBodyData() as IDataObject;

		const opcoes = this.getNodeParameter('opcoes', {}) as IDataObject;
		const eventos = this.getNodeParameter('eventos', []) as string[];

		// Verificação opcional de token
		const verificationToken = (opcoes.verificationToken as string) || '';
		if (verificationToken) {
			const headerName = ((opcoes.headerName as string) || 'x-webhook-token').toLowerCase();
			const received = (headers[headerName] as string) || (query.token as string) || '';
			if (received !== verificationToken) {
				const res = this.getResponseObject();
				res.status(401).json({ status: 401, mensagem: 'Token de webhook inválido' });
				return { noWebhookResponse: true };
			}
		}

		// Filtro por situação
		const situacao =
			(body.situacao as string) ||
			((body.operacao as IDataObject)?.situacao as string) ||
			((body.dados_negativacao as IDataObject)?.situacao as string) ||
			'';

		if (eventos.length > 0 && situacao && !eventos.includes(situacao)) {
			return { webhookResponse: { status: 200, mensagem: 'Ignorado pelo filtro' } };
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray({
					headers,
					query,
					body,
					method: req.method,
				}),
			],
		};
	}
}
