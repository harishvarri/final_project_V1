import { useLanguage } from '../context/LanguageContext';

export default function Loader({ text }) {
  const { l } = useLanguage();

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 font-medium">{text || l('Loading...', 'లోడ్ అవుతోంది...')}</p>
    </div>
  );
}
