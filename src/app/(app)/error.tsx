"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We could not load this page. Check your connection and try again.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
