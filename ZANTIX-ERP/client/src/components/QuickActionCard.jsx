import { LuArrowRight } from "react-icons/lu";

function QuickActionCard({ title, description, icon: Icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow p-4 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
          {Icon ? <Icon className="w-6 h-6" /> : null}
        </div>

        <div>
          <div className="font-semibold text-slate-800">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
      </div>

      <LuArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
  );
}

export default QuickActionCard;
