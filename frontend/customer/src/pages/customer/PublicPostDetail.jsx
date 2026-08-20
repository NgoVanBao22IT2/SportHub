import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Tag,
  Trophy,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Share2,
  Eye,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { getPublicPostBySlug } from '../../api/public';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export default function PublicPostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [postData, setPostData] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox Modal State for Gallery Images
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPublicPostBySlug(slug);
      setPostData(res?.data || null);
      setRelatedPosts(res?.relatedPosts || []);
    } catch (err) {
      console.error('Failed to fetch post details:', err);
      setError('Bài viết hoặc sự kiện không tồn tại hoặc đã bị gỡ.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <Skeleton variant="rectangular" height="320px" radius="xl" />
        <Skeleton variant="text" width="70%" height="2rem" />
        <Skeleton variant="text" width="100%" height="1.2rem" />
        <Skeleton variant="text" width="90%" height="1.2rem" />
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <ErrorState
          title="Không tìm thấy bài viết"
          description={error || 'Nội dung này có thể đã bị xóa hoặc hết hạn.'}
          action={
            <Button variant="primary" onClick={() => navigate('/')} leftIcon={<ArrowLeft size={16} />}>
              Quay lại Trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  const post = postData;
  const venue = post.venue;
  const coverUrl = post.cover_image_url || post.cover_image?.large_url || post.cover_image?.image_url;

  // Post gallery images
  const galleryImages = post.post_images ? post.post_images.map(item => item.image).filter(Boolean) : [];

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER & BREADCRUMB */}
      <section className="bg-surface border-b border-border-subtle-medium py-6 px-4">
        <div className="container mx-auto max-w-4xl space-y-3">
          {/* <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-brand-orange">Trang chủ</Link>
            <span>/</span>
            {venue && (
              <>
                <Link to={`/venues/${venue.venue_id}`} className="hover:text-brand-orange">
                  {venue.venue_name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-xs">{post.title}</span>
          </div> */}

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-brand-orange transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
      </section>

      {/* ARTICLE BODY CONTAINER */}
      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
        
        {/* HERO COVER IMAGE */}
        {coverUrl && (
          <div className="relative w-full aspect-21/9 rounded-2xl overflow-hidden shadow-md border border-border-subtle-medium bg-gray-900">
            <img src={coverUrl} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-brand-orange text-white shadow-md uppercase tracking-wider">
                {post.content_type}
              </span>
            </div>
          </div>
        )}

        {/* TITLE & META HEADER */}
        <div className="space-y-3 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted border-t border-gray-100 pt-3">
            {venue && (
              <span className="flex items-center gap-1.5 font-bold text-gray-800">
                <Building2 size={15} className="text-brand-orange" />
                {venue.venue_name}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.publish_at || post.created_at).toLocaleDateString('vi-VN')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye size={14} /> {post.view_count || 0} lượt xem
            </span>
          </div>
        </div>

        {/* EVENT / PROMOTION INFO CARD (IF EVENT OR PROMOTION) */}
        {(post.start_at || post.location || post.promo_code || post.contact_hotline) && (
          <Card radius="2xl" padding="lg" className="border-2 border-brand-orange bg-brand-orange/5 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-brand-orange flex items-center gap-2">
              <Sparkles size={20} />
              Chi tiết Sự kiện & Ưu đãi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {post.start_at && (
                <div className="flex items-start gap-2.5">
                  <Clock size={16} className="text-brand-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Thời gian diễn ra:</span>
                    <span className="text-gray-700">
                      {new Date(post.start_at).toLocaleString('vi-VN')}
                      {post.end_at ? ` - ${new Date(post.end_at).toLocaleString('vi-VN')}` : ''}
                    </span>
                  </div>
                </div>
              )}

              {post.location && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-accent-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Địa điểm tổ chức:</span>
                    <span className="text-gray-700">{post.location}</span>
                  </div>
                </div>
              )}

              {post.contact_hotline && (
                <div className="flex items-start gap-2.5">
                  <Phone size={16} className="text-status-success mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Hotline đăng ký & Hỗ trợ:</span>
                    <span className="text-gray-700 font-semibold">{post.contact_hotline}</span>
                  </div>
                </div>
              )}

              {post.promo_code && (
                <div className="flex items-start gap-2.5">
                  <Tag size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Mã ưu đãi (Promo Code):</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-extrabold text-xs tracking-wider border border-purple-300 mt-0.5">
                      {post.promo_code}
                    </span>
                  </div>
                </div>
              )}

              {post.fee_amount > 0 && (
                <div className="flex items-start gap-2.5">
                  <Trophy size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Lệ phí / Chi phí:</span>
                    <span className="text-brand-orange font-extrabold text-sm">
                      {Number(post.fee_amount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}

              {post.max_participants > 0 && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Giới hạn số lượng:</span>
                    <span className="text-gray-700">{post.max_participants} suất</span>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION CTA BUTTON */}
            {post.registration_url && (
              <div className="pt-2 border-t border-brand-orange/20 flex justify-end">
                <a
                  href={post.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Đăng ký tham gia ngay <ExternalLink size={14} />
                </a>
              </div>
            )}
          </Card>
        )}

        {/* ARTICLE CONTENT HTML */}
        <div className="bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle-medium shadow-xs space-y-4">
          {post.excerpt && (
            <p className="text-sm font-semibold text-gray-700 italic border-l-4 border-brand-orange pl-4 py-1 leading-relaxed bg-surface-subtle rounded-r-xl">
              {post.excerpt}
            </p>
          )}

          <div
            className="text-sm text-gray-800 leading-relaxed prose max-w-none space-y-4"
            dangerouslySetInnerHTML={{ __html: post.content || 'Nội dung chi tiết đang được cập nhật.' }}
          />
        </div>

        {/* GALLERY IMAGES ATTACHED TO POST */}
        {galleryImages.length > 0 && (
          <div className="space-y-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Image size={20} className="text-brand-orange" />
              Hình ảnh liên quan
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryImages.map((img, idx) => (
                <div
                  key={img.image_id || idx}
                  onClick={() => handleOpenLightbox(idx)}
                  className="cursor-pointer group aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative"
                >
                  <img
                    src={img.medium_url || img.image_url}
                    alt={img.title || 'Gallery Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-dark/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye size={20} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RELATED POSTS / EVENTS */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Bài viết & Sự kiện liên quan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rel) => {
                const relCover = rel.cover_image_url || rel.cover_image?.medium_url || rel.cover_image?.image_url;
                return (
                  <Link
                    key={rel.post_id}
                    to={`/posts/${rel.slug}`}
                    className="group bg-surface p-4 rounded-2xl border border-border-subtle-medium hover:border-brand-orange transition-all flex gap-3 shadow-xs"
                  >
                    {relCover && (
                      <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={relCover} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-brand-orange uppercase">{rel.content_type}</span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-brand-orange transition-colors">
                        {rel.title}
                      </h4>
                      <span className="text-[10px] text-text-muted block">
                        {new Date(rel.publish_at || rel.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxOpen && galleryImages[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-dark/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-brand-orange p-2"
          >
            <X size={28} />
          </button>

          <button
            onClick={() => setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)}
            className="absolute left-4 text-white hover:text-brand-orange p-2 bg-dark/50 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col items-center">
            <img
              src={galleryImages[lightboxIndex].large_url || galleryImages[lightboxIndex].image_url}
              alt="Lightbox View"
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
            <p className="text-xs text-gray-300 mt-3 text-center">
              {lightboxIndex + 1} / {galleryImages.length}
            </p>
          </div>

          <button
            onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryImages.length)}
            className="absolute right-4 text-white hover:text-brand-orange p-2 bg-dark/50 rounded-full"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
