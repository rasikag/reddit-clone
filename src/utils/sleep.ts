export const resolver = (res: any, ms: number) => {
  setTimeout(res, ms);
};
export const sleep = (ms: number) => new Promise((res) => resolver(res, ms));
