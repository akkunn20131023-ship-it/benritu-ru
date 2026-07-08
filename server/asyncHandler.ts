import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Express 4 は async ハンドラ内で throw / reject しても自動で next(err) してくれないため、
 * この wrapper で catch して確実にエラーハンドリングミドルウェアへ回す。
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
}
