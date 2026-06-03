export type ApiEnvelope<TData> = {
  success: boolean;
  message: string;
  data: TData;
};

export type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  next?: NextFetchRequestConfig;
};

export type RequestContext = {
  locale?: string;
  currency?: string;
  country?: string;
  cartToken?: string;
};
