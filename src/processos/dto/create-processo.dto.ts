import { Tipo } from "@prisma/client"

export class CreateProcessoDto {
    tipo?: Tipo
    codigo?: string
    num_processo: string
    protocolo_ad?: string
    cpf_cnpj?: string
    data_entrada: Date
    parcelas: IParcela[]
}

export interface IParcela {
    num_parcela: number
    valor: number
    vencimento: Date
    data_quitacao?: Date
    ano_pagamento?: number
    status_quitacao: boolean
}
