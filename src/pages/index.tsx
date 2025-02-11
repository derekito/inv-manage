export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-indigo-600 mb-8">Inventory Management System</h1>
                <p className="text-gray-600">Welcome to the inventory management system. This system helps you track and manage inventory across multiple Shopify stores.</p>
                <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                  <p>Features:</p>
                  <ul className="list-disc space-y-2 pl-5 pt-2">
                    <li>Track inventory levels from multiple Shopify stores</li>
                    <li>Manage warehouse locations</li>
                    <li>Real-time inventory updates</li>
                    <li>Product location tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 