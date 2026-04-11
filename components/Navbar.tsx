export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-4 bg-white/70 backdrop-blur-md z-50">
      <h1 className="text-xl font-bold text-orange-500">VIA</h1>

      <div className="hidden md:flex gap-8 text-gray-700">
        <a href="#">Features</a>
        <a href="#">How it works</a>
        <a href="#">Dashboard</a>
        <a href="#">Pricing</a>
      </div>

      <div className="flex gap-4">
        <button className="text-gray-700">Log in</button>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg">
          Sign up →
        </button>
      </div>
    </nav>
  );
}