// 変数宣言
const mapItem = new Map();
const mapRack = new Map();
const mapType = new Map();
const mapTier = new Map();
const mapTypeGroup = new Map();
const mapCheckItem = new Map();
const mapCheckKeep = new Map();
const mapCheckType = new Map();
const dbCheckItem = new IndexedDB({store: "CheckItem", key: "Name"});
const dbCheckKeep = new IndexedDB({store: "CheckKeep", key: "Name"});
const dbCheckType = new IndexedDB({store: "CheckType", key: "Type"});
const Para = new IndexedDBkv({store: "para"});

const Magnification = [1, 1.25, 2, 3, 5];

// 関数宣言
// □起動処理
const startup = async () => {
	web2map($Item, mapItem, csv2item);
	web2map($Rack, mapRack, csv2rack);
	web2map($Type, mapType, csv2type);
	web2map($Tier, mapTier, csv2tier);
	web2map($TypeGroup, mapTypeGroup, csv2typegroup);
	[...(await dbCheckItem.getAll())].forEach(v => mapCheckItem.set(v.Name, v));
	[...(await dbCheckKeep.getAll())].forEach(v => mapCheckKeep.set(v.Name, v));
	[...(await dbCheckType.getAll())].forEach(v => mapCheckType.set(v.Type, v));
	console.groupCollapsed("web2map");
	console.log("mapItem", mapItem);
	console.log("mapRack", mapRack);
	console.log("mapType", mapType);
	console.log("mapTier", mapTier);
	console.log("mapTypeGroup", mapTypeGroup);
	console.log("mapCheckItem", mapCheckItem);
	console.log("mapCheckKeep", mapCheckKeep);
	console.log("mapCheckType", mapCheckType);
	console.groupEnd();

	const mapEnchantedE = new Map();
	const mapEnchantedS = new Map();
	const mapIncrease15 = new Map();
	const mapLocalName = new Map();
	web2map($EnchantedE, mapEnchantedE, csv2map);
	web2map($EnchantedS, mapEnchantedS, csv2map);
	web2map($Increase15, mapIncrease15, csv2map);
	web2map($LocalName, mapLocalName, csv2map);
	mapItem.forEach((v, k) => {
		if(v.Type == "Runestone" || v.Type == "Moonstone") v.Type = "Stone";
		v.EnchantedE = mapEnchantedE.has(v.Name);
		v.EnchantedS = mapEnchantedS.has(v.Name);
		v.Increase = (v.Type == "Stone" || v.Type == "Enchantment") ? 1 : mapIncrease15.has(v.Name) ? 1.5 : 1.25;
		v.Value2 = v.Value * v.Increase;
		v.UseE2 = Math.floor(v.UseE * 0.9);
		v.LocalName = mapLocalName.get(v.Name) ?? v.Name;
		v.LocalType = mapType.get(v.Type)?.LocalType ?? v.Type;
		mapItem.set(k, v);
	});
	console.groupCollapsed("編集後");
	console.log("mapItem", mapItem);
	console.groupEnd();

	for(const e of document.querySelectorAll("[type=text]")) e.addEventListener("focus", e => {
		const me = e.currentTarget;
		me.value = e.currentTarget.value.replaceAll(",", "");
		me.select();
	});
	for(const e of document.querySelectorAll("[type=text]")) e.addEventListener("blur", async e => {
		const me = e.currentTarget;
		me.value = isNaN(me.value) ? 0 : (+me.value).toLocaleString();
		await Para.set(me.dataset.para, me.value);
	});

	document.querySelectorAll("[name=groupTier]").forEach(e => e.addEventListener("change", offTier));
	document.querySelectorAll("[name=Tier]").forEach(e => e.addEventListener("change", toggleGroupTier));
	document.querySelectorAll(".changeMode").forEach(e => e.addEventListener("change", changeMode));
	document.querySelectorAll("[name=switch1]").forEach(e => e.addEventListener("change", switch1));

	document.querySelectorAll(".showList").forEach(e => e.addEventListener("change", showList));

	const para = await Para.getObject();
	$MaxEnergy.value = para.MaxEnergy ?? "1,000";
	$CounterEnergy.value = para.CounterEnergy ?? "20";
	$Discount.value = para.Discount ?? "500";
	$Surchage.value = para.Surchage ?? "600";
	$ForKing.value = para.ForKing ?? "1,000,000";

	document.querySelector("[name=Mode]").dispatchEvent(new Event("change"));
//	document.querySelector("[name=switch1]").dispatchEvent(new Event("change"));

	window.addEventListener("resize", resizeWindow);
}

// □データ編集
const web2map = (e, map, callback) => {
	e.text.split("\n").filter(Boolean).map(data => {
		const [key, value] = callback(data);
		map.set(key, value);
	});
}
const csv2map = data => data.split("\t");
const csv2item = data => {
	const [Name, Type, sTier, sValue, sGetE, sUseE] = data.split("\t");
	const [Tier, Value, GetE, UseE] = string2number(sTier, sValue, sGetE, sUseE);
	return [Name, {Name, Type, Tier, Value, GetE, UseE}];
}
const csv2rack = data => {
	const [Rack, ...Type] = data.split("\t");
	return [Rack, {Rack, Type}];
}
const csv2type = data => {
	const [Type, LocalType, Tab, Rack] = data.split("\t");
	return [Type, {Type, LocalType, Tab, Rack}];
}
const csv2tier = data => {
	const [sTier, LocalTier] = data.split("\t");
	const [Tier] = string2number(sTier);
	return [Tier, {Tier, LocalTier}];
}
const csv2typegroup = data => {
	const [TypeGroup, LocalTypeGroup, ...Type] = data.split("\t");
	return [TypeGroup, {TypeGroup, LocalTypeGroup, Type}];
}
const string2number = (...args) => args.map(s => +s.replaceAll(",", ""));
const string2boolean = (...args) => args.map(s => s == "true");

// □イベント処理
const resizeWindow = () => document.querySelector("main").style.marginTop = `${document.querySelector("header").clientHeight}px`;

const offTier = () => document.querySelectorAll("[name=Tier]:checked").forEach(e => e.checked = false);
const toggleGroupTier = () => {
	document.querySelectorAll("[name=groupTier]:checked").forEach(e => e.checked = false);
	if(!document.querySelectorAll("[name=Tier]:checked").length) document.querySelector("[name=groupTier][value=all]").checked = true;
}
const changeMode = () => {
	console.log("changeMode");
	const mode = document.querySelector("[name=Mode]:checked").value;
	document.querySelectorAll("[class*='Disabled']").forEach(e => e.disabled = e.classList.contains(`Disabled${mode}`));
	document.querySelectorAll("[class*='Hide']").forEach(e => {
		if(e.classList.contains(`Hide${mode}`)) {
			e.classList.add("hide");
		} else {
			e.classList.remove("hide");
		}
	});
	resizeWindow();
}
const showList = () => {
	$List.querySelectorAll(".cloned").forEach(e => e.parentNode.removeChild(e));
	const filter = setFilter();
console.log(filter);
	const mode = document.querySelector("[name=Mode]:checked").value;
	const callback = {
		A: showModeA,
		B: showModeB,
		C: showModeC,
		D: showModeD,
		E: showModeE,
		F: showModeF
	}
	callback[mode](filter);
}
const setFilter = () => {
	const Container = document.querySelector("[name=Container]:checked").value;
	const inRack = document.querySelector("[name=Rack]:checked")?.value;
	const Type = inRack
		? mapRack.get(inRack).Type
		: [...mapType].map(([k, v]) => k)
	;
	const inGroupTier = document.querySelector("[name=groupTier]:checked")?.value;
	const Tier = inGroupTier
		? [...Array(11)].map((_, i) => ++i)
		: [...document.querySelectorAll("[name=Tier]:checked")].map(e => +e.value)
	;
	const Rarity = document.querySelector("[name=Rarity]:checked")?.value;
	const sMaxEnergy = $MaxEnergy.value;
	const sCounterEnergy = $CounterEnergy.value;
	const sDiscount = $Discount.value;
	const sSurchage = $Surchage.value;
	const sForKing = $ForKing.value;
	const sElementValue = $ElementValue.value;
	const sSpiritValue = $SpiritValue.value;
	const Donated = document.querySelector("[name=Donated]:checked")?.value;
//	const ValueUp = $ValueUp.checked;
//	const Learner = $Learner.checked;
	const [MaxEnergy, CounterEnergy, Discount, Surchage, ForKing, ElementValue, SpiritValue] = string2number(sMaxEnergy, sCounterEnergy, sDiscount, sSurchage, sForKing, sElementValue, sSpiritValue);

//	return {Container, Type, Tier, Rarity, MaxEnergy, CounterEnergy, Discount, Surchage, ForKing, ElementValue, SpiritValue, Donated, ValueUp, Learner};
	return {Container, Type, Tier, Rarity, MaxEnergy, CounterEnergy, Discount, Surchage, ForKing, ElementValue, SpiritValue, Donated};
}
const showModeA = filter => {
	const {Container, Type, Tier, Discount, Surchage, ForKing, MaxEnergy} = filter;

	const list = [...mapItem].filter(([k, v]) => {
		if(v.Type == "Stone") return false;
		if(v.Type == "Enchantment") return false;
		if(!Type.includes(v.Type)) return false;
		if(!Tier.includes(v.Tier)) return false;
		return true;
	}).reduce((result, [k, v]) => {
		const key = Container == "Type" ? v.Type : v.Tier;
		if(!result.hasOwnProperty(key)) result[key] = [];
		result[key].push(v);
		return result;
	}, {});

	const AllValueUp = [...mapCheckType].filter(([k, v]) => v.AllValueUp).length;

	const fragment = document.createDocumentFragment();
	const map = Container == "Type" ? mapType : mapTier;
	for (const [k, v] of map) {
		if(!list.hasOwnProperty(k)) continue;

		const child = clone($ModeA_group);
		const div = child.querySelector("div");
		const span = child.querySelector("span");
		span.appendChild(addText(`${v.LocalType ?? v.LocalTier}`));

		for (const v2 of list[k]) {
			const child2 = clone($ModeA_data);
			const span2 = child2.querySelector("span");
			span2.appendChild(addText(`${v2.Tier}.${v2.LocalName}`));

			const {Value, GetE, UseE, Keep, Owned, Donation} = getItemInfo(v2);

			const e = child2.querySelectorAll(".Keep");
			e.forEach((v3, i) => {
				const nowValue = roundValue(Value * Magnification[i]);
				const surchageValue = nowValue * (2 + 0.01 * AllValueUp);
				const discountValuePerEnergy = Math.floor(nowValue / 2 / GetE);
				const surchageValuePerEnergy = Math.floor((surchageValue - nowValue) / UseE);
				let sell = "－";
				if(discountValuePerEnergy <= Discount) sell = "半";
				if(surchageValuePerEnergy >= Surchage && MaxEnergy >= UseE) sell = "倍";
				if(i != 0 && nowValue >= ForKing) sell = "王";

				v3.appendChild(addText(`${sell}`));
				v3.dataset.Name = v2.Name;
				v3.dataset.i = i;
				if(Owned && !Donation?.[i]) v3.classList.add("caution");
				if(Keep?.[i]) v3.classList.toggle("onkeep");
				v3.addEventListener("click", changeKeep);
				v3.setAttribute("description", tagLocalNumber`通常価格 ${nowValue} 追加料金価格 ${surchageValue}\n割引販売エネルギー ${GetE}(１エネルギーを得るのに消費する金額 ${discountValuePerEnergy})\n追加料金販売エネルギー ${UseE}(１エネルギを消費して得る金額 ${surchageValuePerEnergy})`);
			});
			div.appendChild(child2);
		}
		fragment.appendChild(child);
	}
	$List.appendChild(fragment);
}
const getItemInfo = Item => {
	const {Name, Type} = Item;
	const CheckItem = mapCheckItem.get(Name);
	const CheckKeep = mapCheckKeep.get(Name);
	const CheckType = mapCheckType.get(Type);

	const Value = CheckItem?.ValueUp ? Item.Value2 : Item.Value;
	const GetE = Item.GetE;
	const UseE = CheckType?.CostDown ? Item.UseE2 : Item.UseE;
	const Keep = CheckKeep?.Keep;
	const Owned = CheckItem?.Owned;
	const ValueUp = CheckItem?.ValueUp;
	const Donation = CheckItem?.Donation;

	return {Value, GetE, UseE, Keep, Owned, ValueUp, Donation};
}
const showModeB = async filter => {
	const {Container, Type, Tier, Discount, Surchage, MaxEnergy, Rarity} = filter;

	const list = [...mapItem].filter(([k, v]) => {
		if(v.Type == "Stone") return false;
		if(v.Type == "Enchantment") return false;
		if(!Type.includes(v.Type)) return false;
		if(!Tier.includes(v.Tier)) return false;
		return true;
	}).reduce((result, [k, v]) => {
		const key = Container == "Type" ? v.Type : v.Tier;
		if(!result.hasOwnProperty(key)) result[key] = [];
		result[key].push(v);
		return result;
	}, {});

	const AllValueUp = [...mapCheckType].filter(([k, v]) => v.AllValueUp).length;

	const fragment = document.createDocumentFragment();
	const map = Container == "Type" ? mapType : mapTier;
	for (const [k, v] of map) {
		if(!list.hasOwnProperty(k)) continue;

		const child = clone($ModeB_group);
		const div = child.querySelector("div");
		const span = child.querySelector("span");
		span.appendChild(addText(`${v.LocalType ?? v.LocalTier}`));

		let flg = false;
		for (const v2 of list[k]) {
			const child2 = clone($ModeB_data);
			const span2 = child2.querySelectorAll("span");
			span2[0].appendChild(addText(`${v2.Tier}.${v2.LocalName}`));

			const {Value, GetE, UseE, Keep, Owned, Donation} = getItemInfo(v2);
			const nowValue = roundValue(Value * Magnification[Rarity]);
			const surchageValue = nowValue * (2 + 0.01 * AllValueUp);
//			const surchageValuePerEnergy = Math.floor((surchageValue - nowValue) / UseE);
//			if(surchageValuePerEnergy < Surchage) continue;
			const discountValuePerEnergy = Math.floor(nowValue / 2 / GetE);
			if(discountValuePerEnergy <= Discount) continue;
			if(MaxEnergy < UseE) continue;
			const Value2 = surchageValue - (Discount * UseE);
			flg = true;

			span2[1].appendChild(document.createTextNode(tagLocalNumber`${Value2}`));

			span2[1].setAttribute("description", tagLocalNumber`追加料金価格－（１エネルギーを得るのに消費する金額×追加料金販売エネルギー）\n${surchageValue} - (${Discount} * ${UseE})`);
			div.appendChild(child2);
		}
		if(flg) fragment.appendChild(child);
	}
	$List.appendChild(fragment);
}
const showModeC = async filter => {
	console.log("showModeC")
}
const showModeD = filter => {
	const {Container, Type, Tier, Donated} = filter;

	const list = [...mapItem].filter(([k, v]) => {
		if(v.Type == "Stone") return false;
		if(!Type.includes(v.Type)) return false;
		if(!Tier.includes(v.Tier)) return false;
		return true;
	}).reduce((result, [k, v]) => {
		const key = Container == "Type" ? v.Type : v.Tier;
		if(!result.hasOwnProperty(key)) result[key] = [];
		result[key].push(v);
		return result;
	}, {});

	const fragment = document.createDocumentFragment();
	const map = Container == "Type" ? mapType : mapTier;
	for (const [k, v] of map) {
		if(!list.hasOwnProperty(k)) continue;

		const child = clone($ModeD_group);
		const div = child.querySelector("div");
		const span = child.querySelector("span");
		span.appendChild(addText(`${v.LocalType ?? v.LocalTier}`));

		let flg = false;
		for (const v2 of list[k]) {
			const child2 = clone($ModeD_data);
			const span2 = child2.querySelector("span");
			const checkbox = child2.querySelectorAll("input");

			const {Value, Owned, ValueUp, Donation} = getItemInfo(v2);
			if(Donation?.[Donated]) continue;
			flg = true;

			span2.dataset.Name = v2.Name;
			span2.appendChild(addText(`${v2.Tier}.${v2.LocalName}`));

			checkbox[0].dataset.Name = v2.Name;
			checkbox[0].dataset.key = "Owned";
			checkbox[0].checked = Owned;
			checkbox[0].addEventListener("change", chengeCheckItem);

			checkbox[1].dataset.Name = v2.Name;
			checkbox[1].dataset.key = "ValueUp";
			checkbox[1].checked = ValueUp;
			checkbox[1].addEventListener("change", chengeCheckItem);
			if(v2.Type == "Enchantment") {
				checkbox[1].classList.add("hide2");
				checkbox[1].parentNode.classList.add("hide2");
			}

			const e = child2.querySelectorAll(".Donation");
			e.forEach((v3, i) => {
				v3.dataset.Name = v2.Name;
				v3.dataset.key = "Donation";
				v3.dataset.i = i;
				if(Donation?.[i]) v3.checked = true;
				v3.addEventListener("change", chengeCheckItem);
			});

			div.appendChild(child2);
		};
		if(flg) fragment.appendChild(child);
	};
	$List.appendChild(fragment);
}
const showModeE = filter => {
	const fragment = document.createDocumentFragment();
	for (const [k, v] of mapTypeGroup) {
		const child = clone($ModeE_group);
		const div = child.querySelector("div");
		const span = child.querySelector("span");
		span.appendChild(addText(`${v.LocalTypeGroup}`));

		for (const v2 of v.Type) {
			const {LocalType, CostDown, TypeValueUp, AllValueUp} = getTypeInfo(v2);

			const child2 = clone($ModeE_data);
			const span2 = child2.querySelector("span");
			const checkbox = child2.querySelectorAll("input");

			span2.appendChild(addText(`${LocalType}`));

			checkbox[0].dataset.Type = v2;
			checkbox[0].dataset.key = "CostDown";
			checkbox[0].checked = CostDown;
			checkbox[0].addEventListener("change", chengeCheckType);

			checkbox[1].dataset.Type = v2;
			checkbox[1].dataset.key = "TypeValueUp";
			checkbox[1].checked = TypeValueUp;
			checkbox[1].addEventListener("change", chengeCheckType);

			checkbox[2].dataset.Type = v2;
			checkbox[2].dataset.key = "AllValueUp";
			checkbox[2].checked = AllValueUp;
			checkbox[2].addEventListener("change", chengeCheckType);

			if(v2 == "Stone" || v2 == "Element" || v2 == "Spirit") {
				checkbox[0].classList.add("hide2");
				checkbox[0].parentNode.classList.add("hide2");
				checkbox[1].classList.add("hide2");
				checkbox[1].parentNode.classList.add("hide2");
			}
			div.appendChild(child2);
		}
		fragment.appendChild(child);
	}
	$List.appendChild(fragment);
}
const getTypeInfo = Type => {
	const {LocalType} = mapType.get(Type);
	const {CostDown, TypeValueUp, AllValueUp} = mapCheckType.get(Type);
	return {LocalType, CostDown, TypeValueUp, AllValueUp};
}
const showModeF = async filter => {
	const fragment = document.createDocumentFragment();
	const Container = document.querySelector("[name=Container]:checked").value;
	const donation = document.querySelector("[name=Donation]:checked").value;
	const map = Container == "Type" ? mapType : mapTier;
	map.forEach(v => {
		const child = clone($ModeF_group);
		const div = child.querySelector("div");
		const span = child.querySelector("span");
		span.appendChild(addText(`${v.LocalType ?? v.LocalTier}`));

		let flg = false;
		mapItem.forEach(v2 => {
			if(!filter.type.includes(v2.Type)) return;
			if(!filter.tier.includes(v2.Tier)) return;
			if(v.Type != v2.Type && v.Tier != v2.Tier) return;
			flg = true;

			const child2 = clone($ModeF_data);
			const span2 = child2.querySelectorAll("span");
			span2[0].appendChild(addText(`${v2.Tier}.${v2.LocalName}`));
			span2[1].appendChild(addText(tagLocalNumber`${v2.Value}`));
			span2[1].dataset.value1 = tagLocalNumber`${v2.Value}`;
			span2[1].dataset.value2 = tagLocalNumber`${roundValue(v2.Value2)}`;
			span2[1].dataset.value3 = tagLocalNumber`${v2.GetE}`;
			span2[1].dataset.value4 = tagLocalNumber`${v2.UseE}`;
			span2[1].dataset.value5 = tagLocalNumber`${v2.UseE2}`;

			div.appendChild(child2);
		});
		if(flg) fragment.appendChild(child);
	});
	$List.appendChild(fragment);
}
const clone = e => document.importNode(e.content, true);
const addText = str => document.createTextNode(str);
const roundValue = value => {
	let                  x = 50000;
	if(value <= 1000000) x =  5000;
	if(value <=  100000) x =   500;
	if(value <=   10000) x =    50;
	if(value <=    1000) x =    10;
	return Math.round(value / x) * x;
}
const tagLocalNumber = (sList, ...vList) => {
	const LocalValue = v => {
		return v.toLocaleString();
	}
	return vList
		.map((v, i) => sList[i] + LocalValue(v))
		.concat(sList.slice(vList.length))
		.join("")
	;
}
const switch1 = () => document.querySelectorAll(".switch1").forEach(e => e.classList.value = `switch1 ${document.querySelector("[name=switch1]:checked").value}`);
const chengeCheckItem = async e => {
	const me = e.currentTarget;
	const Name = me.dataset.Name;
	const key = me.dataset.key;
	const i = me.dataset.i;
	const checked = me.checked;

	const _default = {Name, Owned: false, ValueUp: false, Donation: [false, false, false, false, false]};
	const CheckItem = await dbCheckItem.get(Name) ?? _default;
	if(i) {
		CheckItem[key][i] = checked;
	} else {
		CheckItem[key] = checked;
	}

	const parent = me.parentNode.parentNode;
	if(!checked && key == "Owned") {
		parent.querySelector("[data-key=ValueUp]").checked = CheckItem.ValueUp = false;
		parent.querySelector("[data-i='0']").checked = CheckItem.Donation[0] = false;
		parent.querySelector("[data-i='1']").checked = CheckItem.Donation[1] = false;
		parent.querySelector("[data-i='2']").checked = CheckItem.Donation[2] = false;
		parent.querySelector("[data-i='3']").checked = CheckItem.Donation[3] = false;
		parent.querySelector("[data-i='4']").checked = CheckItem.Donation[4] = false;
	}
	if(!checked && key == "ValueUp") {
		parent.querySelector("[data-i='0']").checked = CheckItem.Donation[0] = false;
		parent.querySelector("[data-i='1']").checked = CheckItem.Donation[1] = false;
		parent.querySelector("[data-i='2']").checked = CheckItem.Donation[2] = false;
		parent.querySelector("[data-i='3']").checked = CheckItem.Donation[3] = false;
		parent.querySelector("[data-i='4']").checked = CheckItem.Donation[4] = false;
	}
	if(checked && key == "ValueUp") {
		parent.querySelector("[data-key=Owned]").checked = CheckItem.Owned = true;
	}
	if(checked && key == "Donation") {
		parent.querySelector("[data-key=Owned]").checked = CheckItem.Owned = true;
		parent.querySelector("[data-key=ValueUp]").checked = CheckItem.ValueUp = true;
	}
	mapCheckItem.set(CheckItem.Name, CheckItem);
	dbCheckItem.put(CheckItem);
}
const chengeCheckType = async e => {
	const me = e.currentTarget;
	const Type = me.dataset.Type;
	const key = me.dataset.key;
	const checked = me.checked;

	const _default = {Type, CostDown: false, TypeValueUp: false, AllValueUp: false};
	const CheckType = await dbCheckType.get(Type) ?? _default;
	CheckType[key] = checked;

	const parent = me.parentNode.parentNode;
	if(!checked && key == "CostDown") {
		parent.querySelector("[data-key=TypeValueUp]").checked = CheckType.TypeValueUp = false;
		parent.querySelector("[data-key=AllValueUp]").checked = CheckType.AllValueUp = false;
	}
	if(!checked && key == "TypeValueUp") {
		parent.querySelector("[data-key=AllValueUp]").checked = CheckType.AllValueUp = false;
	}
	if(checked && key == "TypeValueUp") {
		parent.querySelector("[data-key=CostDown]").checked = CheckType.CostDown = true;
	}
	if(checked && key == "AllValueUp") {
		parent.querySelector("[data-key=CostDown]").checked = CheckType.CostDown = true;
		parent.querySelector("[data-key=TypeValueUp]").checked = CheckType.TypeValueUp = true;
	}
	mapCheckType.set(Type, CheckType);
	dbCheckType.put(CheckType);
}
const changeKeep = async e => {
	const me = e.currentTarget;
	const Name = me.dataset.Name;
	const i = me.dataset.i;

	me.classList.toggle("onkeep");

	const _default = {Name, Keep: [false, false, false, false, false]};
	const CheckKeep = await dbCheckKeep.get(Name) ?? _default;
	CheckKeep.Keep[i] = !CheckKeep.Keep[i];
	mapCheckKeep.set(CheckKeep.Name, CheckKeep);
	dbCheckKeep.put(CheckKeep);
}

// 実行開始
document.addEventListener("DOMContentLoaded", startup);
