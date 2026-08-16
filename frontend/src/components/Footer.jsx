import { MessageCircle, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-12 mt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 ">
              <img src="/logo-badminton.png" alt="logo" className=" w-10 h-15 "  />
              <span className="font-bold text-2xl tracking-tight text-accent-primary">SPORTHUB</span>
            </div>
            <p className="text-sm text-green-50">
              Nền tảng kết nối người chơi và chủ sân hàng đầu Việt Nam. Nâng tầm trải nghiệm thể thao mỗi ngày.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <MessageCircle size={16} />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <Mail size={16} />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer">
                <Phone size={16} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-sm text-green-50">
              <li className="hover:text-white cursor-pointer">Đặt sân thể thao</li>
              <li className="hover:text-white cursor-pointer">Tìm người ghép kèo</li>
              <li className="hover:text-white cursor-pointer">Tổ chức giải đấu</li>
              <li className="hover:text-white cursor-pointer">Phần mềm quản lý</li>
              <li className="hover:text-white cursor-pointer">Cửa hàng dụng cụ</li>
              <li className="hover:text-white cursor-pointer">Chính sách chung</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Công ty</h4>
            <ul className="space-y-2 text-sm text-green-50">
              <li className="hover:text-white cursor-pointer">Về chúng tôi</li>
              <li className="hover:text-white cursor-pointer">Tin tức</li>
              <li className="hover:text-white cursor-pointer">Liên hệ</li>
              <li className="hover:text-white cursor-pointer">Đối tác</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Chính sách</h4>
            <ul className="space-y-2 text-sm text-green-50">
              <li className="hover:text-white cursor-pointer">Điều khoản</li>
              <li className="hover:text-white cursor-pointer">Bảo mật</li>
              <li className="hover:text-white cursor-pointer">Trang Chủ Hỗ Trợ</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-center text-xs text-accent-primary">
          © 2026 SportHub. Bản quyền thuộc về công ty TNHH 1 thành viên MARAHUB.
        </div>
      </div>
    </footer>
  );
}
