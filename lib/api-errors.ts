import { NextResponse } from "next/server.js";
import { ZodError } from "zod";

export class ApiError extends Error {
  readonly status: number;
  readonly publicMessage: string;

  constructor(message: string, status: number, publicMessage = message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "You need to sign in with GitHub to continue.") {
    super(message, 401, message);
    this.name = "UnauthorizedError";
  }
}

export function createApiErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Please check your input and try again.",
        fieldErrors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.publicMessage }, { status: error.status });
  }

  console.error("[api-error]", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
