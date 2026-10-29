from pathlib import Path
import json, re, math

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'terms.js'


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def term(id_, cn, en, cat, formula='', props=None, lang='英语复合词', root_term='', gloss='', note='', tags=None):
    props = props or [['说明', '专业词汇'], ['用途', '粉碎与分级流程']]
    tags = tags or ['扩充词库', cat]
    return f"    T({js(id_)}, {js(cn)}, {js(en)}, {js(cat)}, {js(formula)}, {js(props)}, {js(lang)}, {js(root_term or en)}, {js(gloss or '由专业词根构成的工程术语')}, {js(note or '工程复合词；具体含义以工艺上下文为准')}, {js(tags)}),"


# 75 base materials × 4 process forms = 300 entries.
materials = [
    ('铬铁矿', 'chromite'), ('钛铁矿', 'ilmenite'), ('金红石', 'rutile'), ('锆石', 'zircon'),
    ('独居石', 'monazite'), ('锡石', 'cassiterite'), ('黑钨矿', 'wolframite'), ('白钨矿', 'scheelite'),
    ('黄铜矿', 'chalcopyrite'), ('辉铜矿', 'chalcocite'), ('斑铜矿', 'bornite'), ('孔雀石', 'malachite'),
    ('蓝铜矿', 'azurite'), ('方铅矿', 'galena'), ('闪锌矿', 'sphalerite'), ('黄铁矿', 'pyrite'),
    ('白铁矿', 'marcasite'), ('毒砂', 'arsenopyrite'), ('辰砂', 'cinnabar'), ('辉钼矿', 'molybdenite'),
    ('镍黄铁矿', 'pentlandite'), ('硅镁镍矿', 'garnierite'), ('褐铁矿', 'limonite'), ('菱铁矿', 'siderite'),
    ('针铁矿', 'goethite'), ('锂云母', 'lepidolite'), ('锂辉石', 'spodumene'), ('透锂长石', 'petalite'),
    ('绿柱石', 'beryl'), ('刚玉', 'corundum'), ('方镁石', 'periclase'), ('水镁石', 'brucite'),
    ('菱镁矿', 'magnesite'), ('文石', 'aragonite'), ('蛇纹石', 'serpentine'), ('橄榄石', 'olivine'),
    ('辉石', 'pyroxene'), ('角闪石', 'amphibole'), ('绿泥石', 'chlorite'), ('伊利石', 'illite'),
    ('蒙脱石', 'montmorillonite'), ('海泡石', 'sepiolite'), ('凹凸棒石', 'palygorskite'), ('叶蜡石', 'pyrophyllite'),
    ('霞石', 'nepheline'), ('方钠石', 'sodalite'), ('透辉石', 'diopside'), ('锂电气石', 'elbaite'),
    ('电气石', 'tourmaline'), ('石榴子石', 'garnet'), ('红柱石', 'andalusite'), ('蓝晶石', 'kyanite'),
    ('硅线石', 'sillimanite'), ('堇青石', 'cordierite'), ('莫来石', 'mullite'), ('耐火黏土', 'fire clay'),
    ('玻璃砂', 'glass sand'), ('石英砂', 'silica sand'), ('河砂', 'river sand'), ('机制砂', 'manufactured sand'),
    ('玄武岩', 'basalt'), ('花岗岩', 'granite'), ('安山岩', 'andesite'), ('辉绿岩', 'diabase'),
    ('凝灰岩', 'tuff'), ('页岩', 'shale'), ('砂岩', 'sandstone'), ('板岩', 'slate'), ('大理石', 'marble'),
    ('石灰华', 'travertine'), ('火山渣', 'scoria'), ('浮石', 'pumice'), ('珍珠岩', 'perlite'),
    ('蛭石', 'vermiculite'), ('膨胀黏土', 'expanded clay'), ('赤泥', 'red mud'), ('磷石膏', 'phosphogypsum'),
]
material_forms = [
    ('矿石', 'ore', '原矿物料', '破碎、磨矿与选矿的入料'),
    ('精矿', 'concentrate', '选矿富集产品', '精矿通常经过脱水、过滤或后续冶炼'),
    ('尾矿', 'tailings', '选矿后排出物', '尾矿粒度与含水率会影响输送和再处理'),
    ('原料', 'feedstock', '工艺入料', '用于配料、粉磨或反应的原始物料'),
]

# 62 component bases × 4 service variants = 248 entries.
components = [
    ('转子', 'rotor'), ('定子', 'stator'), ('转盘', 'rotary disc'), ('齿圈', 'ring gear'),
    ('小齿轮', 'pinion'), ('偏心轴', 'eccentric shaft'), ('曲轴', 'crankshaft'), ('飞轮', 'flywheel'),
    ('平衡轮', 'balance wheel'), ('皮带轮', 'pulley'), ('链轮', 'sprocket'), ('传动带', 'drive belt'),
    ('链条', 'drive chain'), ('联轴器护罩', 'coupling guard'), ('轴套', 'shaft sleeve'), ('轴封', 'shaft seal'),
    ('推力轴承', 'thrust bearing'), ('滚子轴承', 'roller bearing'), ('滑动轴承', 'plain bearing'), ('轴承座', 'bearing housing'),
    ('轴承盖', 'bearing cap'), ('迷宫密封', 'labyrinth seal'), ('填料密封', 'packing seal'), ('机械密封', 'mechanical seal'),
    ('进料斗', 'feed hopper'), ('缓冲仓', 'surge bin'), ('料仓', 'storage bin'), ('仓壁振动器', 'bin activator'),
    ('棒条给料机', 'grizzly feeder'), ('盘式给料机', 'disc feeder'), ('螺旋给料机', 'screw feeder'), ('皮带给料机', 'belt feeder'),
    ('板式给料机', 'apron feeder'), ('振动给料机', 'vibratory feeder'), ('颚式破碎机', 'jaw crusher'), ('圆锥破碎机', 'cone crusher'),
    ('旋回破碎机', 'gyratory crusher'), ('辊式破碎机', 'roll crusher'), ('反击式破碎机', 'impact crusher'), ('锤式破碎机', 'hammer crusher'),
    ('立轴冲击破碎机', 'vertical shaft impact crusher'), ('高压辊磨机', 'high-pressure grinding roll'), ('立式辊磨机', 'vertical roller mill'), ('搅拌磨', 'stirred mill'),
    ('振动磨', 'vibratory mill'), ('棒磨机', 'rod mill'), ('自磨机', 'autogenous mill'), ('半自磨机', 'semi-autogenous mill'),
    ('塔式磨机', 'tower mill'), ('盘磨机', 'disc mill'), ('胶体磨', 'colloid mill'), ('切碎机', 'shredder'),
    ('撕碎机', 'granulator'), ('筛面', 'screen deck'), ('筛网', 'screen mesh'), ('筛框', 'screen frame'),
    ('筛箱', 'screen box'), ('激振器', 'exciter'), ('振动电机', 'vibrator motor'), ('偏心块', 'eccentric weight'), ('弹簧座', 'spring seat'),
    ('橡胶弹簧', 'rubber spring'), ('分级叶轮', 'classifier rotor'), ('导流叶片', 'guide vane'), ('溢流堰', 'overflow weir'), ('沉砂嘴', 'apex nozzle'),
]
component_variants = [
    ('可更换', 'replaceable', '便于检修与快速更换'),
    ('耐磨', 'wear-resistant', '用于高磨蚀性物料工况'),
    ('陶瓷衬里', 'ceramic-lined', '降低金属污染与磨损'),
    ('液压调节', 'hydraulically adjusted', '支持间隙或位置的在线调节'),
]

# 16 cations × 10 anions, excluding the original six chemical entries, gives at least 150.
cations = [
    ('钠', 'sodium', 'Na', 1), ('钾', 'potassium', 'K', 1), ('钙', 'calcium', 'Ca', 2),
    ('镁', 'magnesium', 'Mg', 2), ('铝', 'aluminum', 'Al', 3), ('亚铁', 'iron(II)', 'Fe', 2),
    ('铁(III)', 'iron(III)', 'Fe', 3), ('铜(II)', 'copper(II)', 'Cu', 2), ('锌', 'zinc', 'Zn', 2),
    ('锂', 'lithium', 'Li', 1), ('钡', 'barium', 'Ba', 2), ('铵', 'ammonium', 'NH4', 1),
    ('锰(II)', 'manganese(II)', 'Mn', 2), ('镍(II)', 'nickel(II)', 'Ni', 2), ('钴(II)', 'cobalt(II)', 'Co', 2),
    ('锶', 'strontium', 'Sr', 2),
]
anions = [
    ('氯化物', 'chloride', 'Cl', 1), ('硫酸盐', 'sulfate', 'SO4', 2), ('碳酸盐', 'carbonate', 'CO3', 2),
    ('硝酸盐', 'nitrate', 'NO3', 1), ('磷酸盐', 'phosphate', 'PO4', 3), ('氢氧化物', 'hydroxide', 'OH', 1),
    ('氟化物', 'fluoride', 'F', 1), ('硅酸盐', 'silicate', 'SiO3', 2), ('草酸盐', 'oxalate', 'C2O4', 2),
    ('亚硫酸盐', 'sulfite', 'SO3', 2),
]
existing_chemical_names = {'silicon dioxide', 'calcium carbonate', 'barium sulfate', 'sodium hydroxide', 'sodium carbonate', 'sodium chloride'}

def chemical_formula(cat_symbol, cat_charge, an_symbol, an_charge):
    a = an_charge // math.gcd(cat_charge, an_charge)
    c = cat_charge // math.gcd(cat_charge, an_charge)
    def fmt(symbol, n, poly):
        if n == 1:
            return symbol
        return f'({symbol}){n}' if poly else f'{symbol}{n}'
    return fmt(cat_symbol, a, False) + fmt(an_symbol, c, an_symbol not in {'Cl', 'F'})

# 58 measurement concepts × 4 process locations = 232 entries.
metrics = [
    ('粒度', 'particle size'), ('最大粒径', 'top size'), ('中位粒径', 'median particle size'), ('P80 粒径', 'P80'),
    ('P95 粒径', 'P95'), ('粒度分布', 'size distribution'), ('比表面积', 'specific surface area'), ('勃氏比表面积', 'Blaine fineness'),
    ('筛余', 'sieve residue'), ('含水率', 'moisture content'), ('浆体密度', 'slurry density'), ('矿浆浓度', 'pulp density'),
    ('固体浓度', 'solids concentration'), ('流量', 'flow rate'), ('质量流量', 'mass flow rate'), ('体积流量', 'volumetric flow rate'),
    ('处理量', 'throughput'), ('功率', 'power draw'), ('单位能耗', 'specific energy'), ('邦德功指数', 'Bond work index'),
    ('哈氏可磨性指数', 'Hardgrove index'), ('磨蚀指数', 'abrasion index'), ('冲击强度', 'impact strength'), ('抗压强度', 'compressive strength'),
    ('抗拉强度', 'tensile strength'), ('堆积密度', 'bulk density'), ('真密度', 'true density'), ('颗粒密度', 'particle density'),
    ('休止角', 'angle of repose'), ('摩擦系数', 'coefficient of friction'), ('动力黏度', 'dynamic viscosity'), ('屈服应力', 'yield stress'),
    ('沉降速度', 'settling velocity'), ('沉降速率', 'sedimentation rate'), ('气流速度', 'air velocity'), ('气体流量', 'gas flow'),
    ('压降', 'pressure drop'), ('差压', 'differential pressure'), ('温度', 'temperature'), ('振幅', 'vibration amplitude'),
    ('振动频率', 'vibration frequency'), ('噪声级', 'sound level'), ('扭矩', 'torque'), ('转速', 'rotational speed'),
    ('叶尖速度', 'tip speed'), ('循环负荷', 'circulating load'), ('分级效率', 'classification efficiency'), ('切割粒径', 'cut size'),
    ('旁路分流率', 'bypass fraction'), ('锐度指数', 'sharpness index'), ('回收率', 'recovery'), ('产率', 'yield'),
    ('物料平衡', 'mass balance'), ('停留时间', 'residence time'), ('滞留时间', 'retention time'), ('解离度', 'liberation'),
    ('解离程度', 'degree of liberation'), ('磨损速率', 'wear rate'), ('衬板寿命', 'liner life'), ('粉尘浓度', 'dust concentration'),
]
locations = [
    ('入料', 'feed'), ('产品', 'product'), ('磨机排料', 'mill discharge'), ('分级机溢流', 'classifier overflow'),
]

lines = []
for cn, en in materials:
    for form_cn, form_en, gloss, note in material_forms:
        lines.append(term(
            f'expanded-material-{slug(en)}-{slug(form_en)}', f'{cn}{form_cn}', f'{en} {form_en}', 'material',
            props=[['物料形态', gloss], ['工艺关注点', note]],
            root_term=f'{en} + {form_en}', gloss='英语复合词：物料名称与工艺形态组合', note=note,
            tags=['物料', '扩充词库', form_cn]
        ))

for cn, en in components[:58]:
    for vcn, ven, note in component_variants:
        lines.append(term(
            f'expanded-component-{slug(ven)}-{slug(en)}', f'{vcn}{cn}', f'{ven} {en}', 'component',
            props=[['部件类别', cn], ['工程说明', note]],
            root_term=f'{ven} + {en}', gloss='英语复合词：部件名称与工况修饰语组合', note=note,
            tags=['部件', '扩充词库', vcn]
        ))

chemical_lines = []
for ccn, cen, csym, ccharge in cations:
    for acn, aen, asym, acharge in anions:
        en = f'{cen} {aen}'
        if en in existing_chemical_names:
            continue
        formula = chemical_formula(csym, ccharge, asym, acharge)
        chemical_lines.append(term(
            f'expanded-chemical-{slug(en)}', f'{acn.replace("物", "").replace("盐", "")}{ccn}', en, 'chemical', formula,
            props=[['化学类别', f'{acn}盐或{acn}化合物'], ['工艺相关性', '可能出现在配料、浸出、表面改性或废水处理中']],
            lang='化学命名法', root_term=f'{cen} + {aen}', gloss='离子名称按化学命名法组合',
            note='化学式按离子电荷配平；实际使用需结合纯度、浓度与安全数据表', tags=['化学品', '扩充词库']
        ))
lines.extend(chemical_lines[:150])

for cn, en in metrics:
    for lcn, len_ in locations:
        lines.append(term(
            f'expanded-metric-{slug(en)}-{slug(len_)}', f'{lcn}{cn}', f'{len_} {en}', 'metric',
            props=[['测量对象', lcn], ['工程用途', '用于过程控制、设备选型或产品质量评价']],
            root_term=f'{len_} + {en}', gloss='英语复合词：测量位置与工程指标组合', note='指标定义、采样位置与计算方法应与项目质量标准保持一致',
            tags=['物性', '扩充词库', lcn]
        ))

assert len(lines) == 930, len(lines)
text = DATA.read_text(encoding='utf-8')
if 'expanded-material-' in text:
    raise SystemExit('data/terms.js 已包含扩充词条，拒绝重复生成')
marker = "  ];\n})(typeof window !== 'undefined' ? window : globalThis);"
if marker not in text:
    raise SystemExit('找不到 data/terms.js 末尾插入点')
block = "  ];\n\n  /* ── 扩充词库：930 条可连续学习的工程词汇 ─────────────────── */\n  root.TERMS.push(\n" + '\n'.join(lines).rstrip(',') + "\n  );\n})(typeof window !== 'undefined' ? window : globalThis);"
DATA.write_text(text.replace(marker, block), encoding='utf-8')
print(f'追加 {len(lines)} 条，词库总数 1000（化学品新增 {len(chemical_lines[:150])} 条）')
