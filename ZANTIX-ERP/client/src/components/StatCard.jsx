function StatCard({ title, value, icon: Icon, color = "bg-blue-100", link }) {
	return (
		<div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between">
			<div className="flex items-center gap-3">
				<div className={`p-3 rounded-lg ${color}`}>
					{Icon ? <Icon className="w-5 h-5 text-white" /> : null}
				</div>

				<div>
					<div className="text-sm text-slate-500">{title}</div>
					<div className="text-2xl font-bold mt-1">{value}</div>
				</div>
			</div>

			{link ? (
				<div className="mt-3 text-sm text-blue-600">{link}</div>
			) : null}
		</div>
	);
}

export default StatCard;
