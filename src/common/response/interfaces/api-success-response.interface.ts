export interface ApiSuccessResponse<T = unknown> {
  code: string;
  message: string;
  data: T;
}
