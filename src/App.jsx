import ZipperVideo from './components/ZipperVideo'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-sky-900">
      <div className="relative min-h-screen flex items-center justify-center p-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
              Zipper Loading – Pixel Art
            </h1>
            <p className="text-sky-200 max-w-2xl mx-auto">
              Animasi resleting membuka dari kiri ke kanan dengan latar biru cerah, resleting putih dan outline hitam. 
              Anda bisa memutar pratinjau dan merekam menjadi video WebM untuk dipakai sebagai loading screen.
            </p>
          </div>

          <ZipperVideo />

          <div className="text-center mt-10">
            <p className="text-sky-300/80 text-sm">
              Tip: Setelah mengunduh WebM, Anda dapat mengonversinya ke MP4 atau GIF sesuai kebutuhan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App