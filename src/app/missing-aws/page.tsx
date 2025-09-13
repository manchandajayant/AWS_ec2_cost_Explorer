export default function MissingAwsPage() {
    const mockOn = process.env.NEXT_PUBLIC_USE_MOCK === "1" || process.env.USE_MOCK === "1";

    return (
        <main className="max-w-3xl mx-auto p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h1 className="text-lg font-semibold text-amber-900 mb-2">AWS Credentials Required</h1>
                <p className="text-sm text-amber-900 mb-3">
                    AWS credentials were not detected in the environment. To fetch real data from AWS, set the following
                    environment variables and restart the app:
                </p>
                <ul className="list-disc pl-6 text-sm text-amber-900 mb-4">
                    <li><code className="font-mono">AWS_ACCESS_KEY_ID</code></li>
                    <li><code className="font-mono">AWS_SECRET_ACCESS_KEY</code></li>
                    <li><code className="font-mono">AWS_REGION</code> (optional, defaults to <code className="font-mono">us-east-1</code>)</li>
                </ul>

                <div className="rounded-lg bg-white border border-amber-200 p-4 mb-4">
                    <div className="text-sm text-amber-900">
                        {mockOn ? (
                            <>
                                Mock mode has been enabled automatically (<code className="font-mono">USE_MOCK=1</code> and
                                {" "}
                                <code className="font-mono">NEXT_PUBLIC_USE_MOCK=1</code>). You can continue exploring the
                                dashboard using synthetic data.
                            </>
                        ) : (
                            <>Mock mode is available. Set <code className="font-mono">USE_MOCK=1</code> and{" "}
                                <code className="font-mono">NEXT_PUBLIC_USE_MOCK=1</code> to use the built-in mock API.</>
                        )}
                    </div>
                </div>

                <p className="text-sm text-amber-900 mb-4">
                    See <code className="font-mono">README.md</code> in the project root for details on configuring AWS
                    credentials and using the mock API.
                </p>

                <div className="flex gap-3">
                    <a href="/" className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">
                        Go to Dashboard
                    </a>
                    <a href="https://docs.aws.amazon.com/sdkref/latest/guide/environment-variables.html" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">
                        AWS env var docs
                    </a>
                </div>
            </div>
        </main>
    );
}

