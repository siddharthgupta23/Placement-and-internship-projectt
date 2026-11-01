import re

path = r'd:\placement and internship project(demo)\frontend\src\pages\AdminDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Remove all insertions of the insights button that might be injected wrongly
block_pattern = r'\s*<div onClick=\{\(\) => setView\(\'insights\'\)\} className=\"col-span-2 md:col-span-4[\s\S]*?<Navigation className=\"w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition translate-x-0 group-hover:translate-x-2\" />\s*</div>'
code = re.sub(block_pattern, '', code)

# Remove the one with bg-linear-to-r just in case
block_pattern2 = r'\s*<div onClick=\{\(\) => setView\(\'insights\'\)\} className=\"col-span-2 md:col-span-4 bg-linear-to-r[\s\S]*?<Navigation className=\"w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition translate-x-0 group-hover:translate-x-2\" />\s*</div>'
code = re.sub(block_pattern2, '', code)

# Re-insert the button properly inside a single parent fragment wrapper ONLY ONCE at the correct spot
stats_grid_end = r'(<Navigation className=\"w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition\" />\s*</div>\s*\)\)}\s*</div>)'

wrapper_replacement = r'''<> \1 
                    <div onClick={() => setView('insights')} className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-r from-slate-900 to-indigo-900 p-6 rounded-2xl shadow-sm border border-indigo-500/30 flex items-center justify-between hover:shadow-lg transition cursor-pointer group mt-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-indigo-500/20 text-indigo-300">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-300">AI Coordinator Dashboard</p>
                                <p className="text-2xl font-black text-white">Smart Insights</p>
                            </div>
                        </div>
                        <Navigation className="w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition translate-x-0 group-hover:translate-x-2" />
                    </div>
                </>'''

code = re.sub(stats_grid_end, wrapper_replacement, code, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("JSX fixed!")
