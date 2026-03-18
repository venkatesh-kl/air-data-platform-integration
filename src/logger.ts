const logger = (() => {
  const stringify = (obj: Record<string, any>) => JSON.stringify(obj);
  const info = (message: string, args?: Record<string, any>) => {
    console.info(stringify({ ...args, message }));
  };

  const warning = (message: string, args?: Record<string, any>) => {
    console.warn(stringify({ ...args, message }));
  };

  const error = (message: string, args?: Record<string, any>) => {
    console.error(stringify({ ...args, message }));
  };

  return {
    info,
    warning,
    error,
  };
})();

export default logger;
