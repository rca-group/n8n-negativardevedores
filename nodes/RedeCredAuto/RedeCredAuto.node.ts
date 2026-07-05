import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

export class RedeCredAuto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RedeCredAuto',
		name: 'redeCredAuto',
		icon: 'file:redecredauto.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interage com a API de Negativação da RedeCredAuto (negativardevedores.com.br)',
		defaults: {
			name: 'RedeCredAuto',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'redeCredAutoApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL:
				'={{$credentials.environment === "prod" ? "https://api.negativardevedores.com.br/prod" : "https://api.negativardevedores.com.br/uat"}}',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		},
		properties: [
			// ----------------------------------
			//            Resource
			// ----------------------------------
			{
				displayName: 'Recurso',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Negativação',
						value: 'negativacao',
					},
					{
						name: 'Autenticação',
						value: 'autenticacao',
					},
				],
				default: 'negativacao',
			},

			// ----------------------------------
			//       Operations: negativacao
			// ----------------------------------
			{
				displayName: 'Operação',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['negativacao'],
					},
				},
				options: [
					{
						name: 'Inclusão',
						value: 'inclusao',
						action: 'Incluir negativação de dívida',
						description: 'Envia uma solicitação de inclusão de dívida (POST /inclusao)',
					},
					{
						name: 'Consulta',
						value: 'consulta',
						action: 'Consultar negativação por protocolo',
						description: 'Consulta os detalhes de uma operação pelo protocolo (GET /consulta)',
					},
					{
						name: 'Listagem',
						value: 'listagem',
						action: 'Listar negativações',
						description: 'Lista operações filtradas por documento, contrato, operação ou datas (GET /listagem)',
					},
					{
						name: 'Exclusão',
						value: 'exclusao',
						action: 'Excluir negativação',
						description: 'Registra a exclusão de uma inclusão já processada (DELETE /exclusao)',
					},
				],
				default: 'inclusao',
			},

			// ----------------------------------
			//     Operations: autenticacao
			// ----------------------------------
			{
				displayName: 'Operação',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['autenticacao'],
					},
				},
				options: [
					{
						name: 'Testar Token',
						value: 'teste',
						action: 'Testar o token de autenticação',
						description: 'Valida o token Bearer e retorna o código do cliente (GET /auth-test)',
					},
				],
				default: 'teste',
			},

			// ==================================
			//        INCLUSÃO — Dívida
			// ==================================
			{
				displayName: 'Data De Vencimento',
				name: 'data_vencimento',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Data de vencimento da dívida no formato YYYY-MM-DD',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},
			{
				displayName: 'Data De Término',
				name: 'data_termino',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Data de término da dívida no formato YYYY-MM-DD',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},
			{
				displayName: 'Valor',
				name: 'valor',
				type: 'number',
				required: true,
				default: 0,
				typeOptions: { numberPrecision: 2 },
				description: 'Valor da dívida',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},
			{
				displayName: 'Contrato',
				name: 'contrato',
				type: 'string',
				required: true,
				default: '',
				description: 'Número do contrato associado à dívida',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},
			{
				displayName: 'Natureza',
				name: 'natureza',
				type: 'options',
				required: true,
				default: 'OO',
				description:
					'Natureza/tipo da dívida. Quando "DC" (Desconto de Cheques), os Dados Bancários passam a ser obrigatórios.',
				options: [
					{ name: 'CD — Crédito Direto', value: 'CD' },
					{ name: 'CP — Crédito Pessoal', value: 'CP' },
					{ name: 'DC — Desconto De Cheques', value: 'DC' },
					{ name: 'DP — Desconto De Duplicatas', value: 'DP' },
					{ name: 'FI — Financiamento', value: 'FI' },
					{ name: 'IM — Impostos/Multas', value: 'IM' },
					{ name: 'OO — Outras Operações', value: 'OO' },
				],
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},

			// ==================================
			//        INCLUSÃO — Devedor
			// ==================================
			{
				displayName: 'Nome do Devedor',
				name: 'nome',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},
			{
				displayName: 'Documento do Devedor',
				name: 'documento',
				type: 'string',
				required: true,
				default: '',
				placeholder: '00000000000',
				description: 'CPF/CNPJ do devedor (somente números)',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
			},

			// ==================================
			//     INCLUSÃO — Endereço
			// ==================================
			{
				displayName: 'Endereço',
				name: 'endereco',
				type: 'collection',
				placeholder: 'Adicionar campo de endereço',
				default: {},
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
				options: [
					{ displayName: 'Bairro', name: 'bairro', type: 'string', default: '' },
					{ displayName: 'CEP', name: 'cep', type: 'string', default: '', placeholder: '00000000' },
					{ displayName: 'Cidade', name: 'cidade', type: 'string', default: '' },
					{ displayName: 'Complemento', name: 'complemento', type: 'string', default: '', description: 'Ex.: SALA 12 (opcional)' },
					{ displayName: 'Logradouro', name: 'logradouro', type: 'string', default: '', description: 'Nome da rua/avenida' },
					{ displayName: 'Número', name: 'numero', type: 'string', default: '' },
					{ displayName: 'UF', name: 'uf', type: 'string', default: '', placeholder: 'MG' },
				],
			},

			// ==================================
			//   INCLUSÃO — Dados Bancários
			// ==================================
			{
				displayName: 'Dados Bancários',
				name: 'dados_bancarios',
				type: 'collection',
				placeholder: 'Adicionar dado bancário',
				default: {},
				description: 'Obrigatório apenas quando a natureza da dívida for "DC" (Desconto de Cheques)',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
				options: [
					{ displayName: 'Agência', name: 'agencia', type: 'string', default: '' },
					{ displayName: 'Alínea', name: 'alinea', type: 'string', default: '', description: 'Informação bancária adicional (opcional)' },
					{ displayName: 'Banco', name: 'banco', type: 'string', default: '', description: 'Código do banco' },
					{ displayName: 'Cheque', name: 'cheque', type: 'string', default: '', description: 'Número do cheque' },
					{ displayName: 'Conta', name: 'conta', type: 'string', default: '' },
					{ displayName: 'Número', name: 'numero', type: 'string', default: '' },
				],
			},

			// ==================================
			//   INCLUSÃO — Campos Adicionais
			// ==================================
			{
				displayName: 'Campos Adicionais',
				name: 'camposAdicionais',
				type: 'collection',
				placeholder: 'Adicionar campo',
				default: {},
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['inclusao'] },
				},
				options: [
					{
						displayName: 'Email do Devedor',
						name: 'email',
						type: 'string',
						placeholder: 'email@email.com',
						default: '',
						description: 'E-mail do devedor (opcional)',
					},
					{
						displayName: 'Celular do Devedor',
						name: 'celular',
						type: 'string',
						default: '',
						placeholder: '99957839491',
						description: 'Celular do devedor com DDD (opcional)',
					},
					{
						displayName: 'Área Informante',
						name: 'area_informante',
						type: 'string',
						default: '',
						placeholder: '1001',
						description: 'Código que identifica a área informante (ex.: 1001 Jurídico, 1002 Compras). Opcional.',
					},
					{
						displayName: 'Webhook URL',
						name: 'webhook_url',
						type: 'string',
						default: '',
						placeholder: 'https://webhook.exemplo.com/negativacao',
						description: 'URL para receber notificações sobre o status do processamento',
					},
				],
			},

			// ==================================
			//            CONSULTA
			// ==================================
			{
				displayName: 'Protocolo',
				name: 'protocolo',
				type: 'string',
				required: true,
				default: '',
				description: 'Número do protocolo da operação a consultar',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['consulta'] },
				},
			},

			// ==================================
			//            EXCLUSÃO
			// ==================================
			{
				displayName: 'ID (Protocolo)',
				name: 'id',
				type: 'string',
				required: true,
				default: '',
				description: 'ID/protocolo do registro a excluir. Apenas inclusões já processadas podem ser excluídas.',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['exclusao'] },
				},
			},

			// ==================================
			//            LISTAGEM
			// ==================================
			{
				displayName: 'Filtros',
				name: 'filtros',
				type: 'collection',
				placeholder: 'Adicionar filtro',
				default: {},
				description: 'É obrigatório informar pelo menos um filtro (ou um intervalo de datas completo)',
				displayOptions: {
					show: { resource: ['negativacao'], operation: ['listagem'] },
				},
				options: [
					{
						displayName: 'Contrato',
						name: 'contrato',
						type: 'string',
						default: '',
						description: 'Número do contrato',
					},
					{
						displayName: 'Data Final',
						name: 'data_final',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
					},
					{
						displayName: 'Data Inicial',
						name: 'data_inicial',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
					},
					{
						displayName: 'Documento',
						name: 'documento',
						type: 'string',
						default: '',
						description: 'Documento (CPF/CNPJ) com dívida',
					},
					{
						displayName: 'Operação',
						name: 'operacao',
						type: 'options',
						default: 'I',
						options: [
							{ name: 'Inclusão (I)', value: 'I' },
							{ name: 'Exclusão (E)', value: 'E' },
						],
					},
					{
						displayName: 'Protocolo',
						name: 'protocolo',
						type: 'string',
						default: '',
						description: 'Número do protocolo (parâmetro "operacao" no ambiente de produção)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('redeCredAutoApi');
		const baseURL =
			credentials.environment === 'prod'
				? 'https://api.negativardevedores.com.br/prod'
				: 'https://api.negativardevedores.com.br/uat';

		for (let i = 0; i < items.length; i++) {
			try {
				let method: IHttpRequestMethods = 'GET';
				let url = '';
				let body: IDataObject | undefined;
				const qs: IDataObject = {};

				if (resource === 'autenticacao') {
					method = 'GET';
					url = '/auth-test';
				} else if (resource === 'negativacao' && operation === 'inclusao') {
					method = 'POST';
					url = '/inclusao';

					const natureza = this.getNodeParameter('natureza', i) as string;
					const endereco = this.getNodeParameter('endereco', i, {}) as IDataObject;
					const dadosBancarios = this.getNodeParameter('dados_bancarios', i, {}) as IDataObject;
					const adicionais = this.getNodeParameter('camposAdicionais', i, {}) as IDataObject;

					if (natureza === 'DC' && Object.keys(dadosBancarios).length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'Dados Bancários são obrigatórios quando a natureza da dívida for "DC" (Desconto de Cheques).',
							{ itemIndex: i },
						);
					}

					const divida: IDataObject = {
						data_vencimento: this.getNodeParameter('data_vencimento', i) as string,
						data_termino: this.getNodeParameter('data_termino', i) as string,
						valor: this.getNodeParameter('valor', i) as number,
						contrato: this.getNodeParameter('contrato', i) as string,
						natureza,
					};
					if (adicionais.area_informante) {
						divida.area_informante = adicionais.area_informante;
					}

					const devedor: IDataObject = {
						nome: this.getNodeParameter('nome', i) as string,
						documento: this.getNodeParameter('documento', i) as string,
					};
					if (adicionais.email) devedor.email = adicionais.email;
					if (adicionais.celular) devedor.celular = adicionais.celular;

					const dadosNegativacao: IDataObject = { divida, devedor };

					if (Object.keys(endereco).length > 0) {
						dadosNegativacao.endereco = endereco;
					}
					if (Object.keys(dadosBancarios).length > 0) {
						dadosNegativacao.dados_bancarios = dadosBancarios;
					}
					if (adicionais.webhook_url) {
						dadosNegativacao.webhook_url = adicionais.webhook_url;
					}

					body = { dados_negativacao: dadosNegativacao };
				} else if (resource === 'negativacao' && operation === 'consulta') {
					method = 'GET';
					url = '/consulta';
					qs.protocolo = this.getNodeParameter('protocolo', i) as string;
				} else if (resource === 'negativacao' && operation === 'exclusao') {
					method = 'DELETE';
					url = '/exclusao';
					qs.id = this.getNodeParameter('id', i) as string;
				} else if (resource === 'negativacao' && operation === 'listagem') {
					method = 'GET';
					url = '/listagem';
					const filtros = this.getNodeParameter('filtros', i, {}) as IDataObject;

					if (Object.keys(filtros).length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'É necessário informar pelo menos um filtro: documento, contrato, protocolo/operação ou intervalo de datas completo.',
							{ itemIndex: i },
						);
					}
					for (const [key, value] of Object.entries(filtros)) {
						if (value !== '' && value !== undefined && value !== null) {
							qs[key] = value;
						}
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Operação "${operation}" não suportada para o recurso "${resource}".`,
						{ itemIndex: i },
					);
				}

				const options: IHttpRequestOptions = {
					method,
					url: `${baseURL}${url}`,
					qs,
					json: true,
				};
				if (body !== undefined) {
					options.body = body;
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'redeCredAutoApi',
					options,
				);

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error.constructor.name === 'NodeApiError' || error.constructor.name === 'NodeOperationError') {
					throw error;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
