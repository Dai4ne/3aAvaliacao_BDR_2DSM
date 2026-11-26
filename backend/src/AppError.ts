// Erro da aplicação com o código HTTP que será enviado ao cliente.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
