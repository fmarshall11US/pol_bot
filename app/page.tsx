import { ArrowRight, FileText, MessageSquare, Sparkles, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="px-6 py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Insurance Policy Intelligence
              <span className="block text-blue-600 dark:text-blue-400">Powered by AI</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload your insurance documents and get instant, accurate answers to your policy questions. 
              Our AI understands complex insurance language and learns from every interaction.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/upload"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
              <a 
                href="/dashboard"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                View Dashboard <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to understand your coverage
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Simple, powerful, and intelligent insurance document analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Document Upload
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Securely upload any insurance policy document. We support PDFs, images, and more.
              </p>
            </div>

            <div className="relative p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Natural Language Q&A
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ask questions in plain English. No insurance jargon required - we'll translate for you.
              </p>
            </div>

            <div className="relative p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI That Learns
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI gets smarter with every interaction, providing increasingly accurate answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why choose our platform?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              We make understanding insurance policies simple and accessible for everyone.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: "Instant Answers",
                  description: "Get immediate responses to your policy questions without waiting for an agent.",
                },
                {
                  name: "100% Accurate",
                  description: "Our AI extracts information directly from your documents, ensuring accuracy.",
                },
                {
                  name: "Secure & Private",
                  description: "Your documents are encrypted and never shared. We prioritize your privacy.",
                },
              ].map((benefit) => (
                <div key={benefit.name} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {benefit.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <p className="flex-auto">{benefit.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-blue-600 dark:bg-blue-700">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to understand your insurance?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Join thousands who are already getting clear answers about their insurance coverage.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
              Start Free Trial
            </button>
            <button className="text-sm font-semibold leading-6 text-white hover:text-blue-100 transition-colors">
              Contact sales <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
