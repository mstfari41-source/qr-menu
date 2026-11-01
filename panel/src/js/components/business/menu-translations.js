// Translations, product details and ingredients, copied from the QR menu (qr-menu/index.html).
// Turkish names and short descriptions live in menu-data.js.

// Category name + subtitle per language
export const CT = {
  en:{ kahvalti:['Breakfast','A fresh start to the day'], kahve:['Coffee','Hot and cold options'], burger:['Burgers','Handmade patty burgers'],
       pizza:['Pizza','Hand-stretched dough, generous toppings'], tatli:['Desserts','For a sweet break'], icecek:['Drinks','Refreshing choices'] },
  de:{ kahvalti:['Frühstück','Frischer Start in den Tag'], kahve:['Kaffee','Heiße und kalte Getränke'], burger:['Burger','Hausgemachte Burger'],
       pizza:['Pizza','Handgeformter Teig, reichlich Belag'], tatli:['Dessert','Für eine süße Pause'], icecek:['Getränke','Erfrischende Auswahl'] },
  ru:{ kahvalti:['Завтрак','Свежее начало дня'], kahve:['Кофе','Горячие и холодные напитки'], burger:['Бургеры','Бургеры ручной работы'],
       pizza:['Пицца','Тесто ручной раскатки, много начинки'], tatli:['Десерты','Для сладкой паузы'], icecek:['Напитки','Освежающий выбор'] }
};

// Product name + short description per language
export const PT = {
  en:{
    'kahvalti-serpme':['Turkish breakfast spread','For 2 people, unlimited tea'],
    'kahvalti-menemen':['Menemen','Tomato, pepper, cheese'],
    'kahvalti-sucuklu':['Eggs with sucuk','In butter, served hot'],
    'kahve-latte':['Latte','Double espresso, steamed milk'],
    'kahve-americano':['Americano','Smooth filter coffee'],
    'kahve-turk':['Turkish coffee','Brewed on embers, with Turkish delight'],
    'burger-smash':['Smash burger','Double patty, cheddar, pickles'],
    'burger-aci':['Spicy burger','Jalapeño, hot sauce'],
    'burger-tavuk':['Chicken burger','Crispy chicken, lettuce, mayo'],
    'pizza-margherita':['Margherita','Tomato, mozzarella, basil'],
    'pizza-karisik':['Mixed pizza','Mushroom, pepper, olives, sausage'],
    'pizza-sucuklu':['Sucuk pizza','Sucuk, kashar cheese, roasted pepper'],
    'tatli-kunefe':['Pistachio künefe','Served hot, with clotted cream'],
    'tatli-cheesecake':['San Sebastian cheesecake','Soft centre, caramel sauce'],
    'tatli-sutlac':['Baked rice pudding','Caramelised top, traditional'],
    'icecek-limonata':['Homemade lemonade','Fresh mint, ice'],
    'icecek-ayran':['Ayran','In a copper bowl, frothy'],
    'icecek-soguk-cay':['Iced tea','Peach or lemon']
  },
  de:{
    'kahvalti-serpme':['Türkisches Frühstück (Serpme)','Für 2 Personen, Tee so viel Sie möchten'],
    'kahvalti-menemen':['Menemen','Tomaten, Paprika, Käse'],
    'kahvalti-sucuklu':['Eier mit Sucuk','In Butter gebraten, heiß serviert'],
    'kahve-latte':['Latte','Doppelter Espresso, heiße Milch'],
    'kahve-americano':['Americano','Milder Filterkaffee'],
    'kahve-turk':['Türkischer Kaffee','Auf Glut gebrüht, mit Lokum'],
    'burger-smash':['Smash Burger','Doppeltes Patty, Cheddar, Gewürzgurken'],
    'burger-aci':['Scharfer Burger','Jalapeño, scharfe Soße'],
    'burger-tavuk':['Chicken Burger','Knuspriges Hähnchen, Salat, Mayo'],
    'pizza-margherita':['Margherita','Tomaten, Mozzarella, Basilikum'],
    'pizza-karisik':['Pizza Mista','Pilze, Paprika, Oliven, Wurst'],
    'pizza-sucuklu':['Sucuk-Pizza','Sucuk, Kaşar-Käse, geröstete Paprika'],
    'tatli-kunefe':['Künefe mit Pistazien','Heiß serviert, mit Kaymak'],
    'tatli-cheesecake':['San-Sebastián-Käsekuchen','Weicher Kern, Karamellsoße'],
    'tatli-sutlac':['Gebackener Milchreis (Sütlaç)','Karamellisierte Oberfläche, traditionell'],
    'icecek-limonata':['Hausgemachte Limonade','Frische Minze, Eis'],
    'icecek-ayran':['Ayran','In der Kupferschale, schaumig'],
    'icecek-soguk-cay':['Eistee','Pfirsich oder Zitrone']
  },
  ru:{
    'kahvalti-serpme':['Турецкий завтрак «серпме»','На двоих, чай без ограничений'],
    'kahvalti-menemen':['Менемен','Помидоры, перец, сыр'],
    'kahvalti-sucuklu':['Яичница с суджуком','На сливочном масле, подаётся горячей'],
    'kahve-latte':['Латте','Двойной эспрессо, горячее молоко'],
    'kahve-americano':['Американо','Мягкий фильтр-кофе'],
    'kahve-turk':['Турецкий кофе','Сварен на углях, с рахат-лукумом'],
    'burger-smash':['Смэш-бургер','Две котлеты, чеддер, маринованные огурцы'],
    'burger-aci':['Острый бургер','Халапеньо, острый соус'],
    'burger-tavuk':['Куриный бургер','Хрустящая курица, салат, майонез'],
    'pizza-margherita':['Маргарита','Томаты, моцарелла, базилик'],
    'pizza-karisik':['Пицца ассорти','Грибы, перец, оливки, колбаски'],
    'pizza-sucuklu':['Пицца с суджуком','Суджук, сыр кашар, печёный перец'],
    'tatli-kunefe':['Кюнефе с фисташками','Подаётся горячим, с каймаком'],
    'tatli-cheesecake':['Чизкейк «Сан-Себастьян»','Нежная сердцевина, карамельный соус'],
    'tatli-sutlac':['Запечённый рисовый пудинг','Румяная корочка, по традиционному рецепту'],
    'icecek-limonata':['Домашний лимонад','Свежая мята, лёд'],
    'icecek-ayran':['Айран','В медной чаше, с пенкой'],
    'icecek-soguk-cay':['Холодный чай','Персик или лимон']
  }
};

// Ingredient names: [tr, en, de, ru]
export const ING = {
  tea:['Çay','Tea','Tee','Чай'], egg:['Yumurta','Egg','Ei','Яйцо'], tomato:['Domates','Tomato','Tomate','Помидор'],
  pepper:['Biber','Pepper','Paprika','Перец'], cheese:['Peynir','Cheese','Käse','Сыр'], butter:['Tereyağı','Butter','Butter','Масло'],
  sucuk:['Sucuk','Sucuk sausage','Sucuk-Wurst','Суджук'], olive:['Zeytin','Olives','Oliven','Оливки'], honey:['Bal','Honey','Honig','Мёд'],
  jam:['Reçel','Jam','Marmelade','Джем'], cream:['Kaymak','Clotted cream','Kaymak','Каймак'], cucumber:['Salatalık','Cucumber','Gurke','Огурец'],
  milk:['Süt','Milk','Milch','Молоко'], espresso:['Espresso','Espresso','Espresso','Эспрессо'], water:['Su','Water','Wasser','Вода'],
  filter:['Filtre kahve','Filter coffee','Filterkaffee','Фильтр-кофе'], ground:['İnce çekilmiş kahve','Finely ground coffee','Fein gemahlener Kaffee','Тонкий помол кофе'],
  delight:['Lokum','Turkish delight','Lokum','Лукум'], patty:['Dana köfte','Beef patty','Rindfleisch-Patty','Говяжья котлета'],
  cheddar:['Cheddar','Cheddar','Cheddar','Чеддер'], pickle:['Turşu','Pickles','Gewürzgurke','Маринованные огурцы'],
  bun:['Brioche ekmek','Brioche bun','Brioche-Brötchen','Булочка бриошь'], lettuce:['Marul','Lettuce','Salat','Салат'],
  jalapeno:['Jalapeño','Jalapeño','Jalapeño','Халапеньо'], hotsauce:['Acı sos','Hot sauce','Scharfe Soße','Острый соус'],
  chicken:['Çıtır tavuk','Crispy chicken','Knuspriges Hähnchen','Хрустящая курица'], mayo:['Mayonez','Mayonnaise','Mayonnaise','Майонез'],
  mozz:['Mozzarella','Mozzarella','Mozzarella','Моцарелла'], basil:['Fesleğen','Basil','Basilikum','Базилик'],
  dough:['İnce hamur','Thin dough','Dünner Teig','Тонкое тесто'], mushroom:['Mantar','Mushrooms','Pilze','Грибы'],
  sausage:['Sosis','Sausage','Wurst','Сосиски'], kashar:['Kaşar peyniri','Kashar cheese','Kaşar-Käse','Сыр кашар'],
  kadayif:['Tel kadayıf','Kadayif pastry','Kadayif-Teig','Кадаиф'], pistachio:['Antep fıstığı','Pistachio','Pistazien','Фисташки'],
  syrup:['Şerbet','Sugar syrup','Zuckersirup','Сироп'], creamcheese:['Krem peynir','Cream cheese','Frischkäse','Сливочный сыр'],
  fcream:['Taze krema','Fresh cream','Frische Sahne','Свежие сливки'], caramel:['Karamel sos','Caramel sauce','Karamellsoße','Карамельный соус'],
  rice:['Pirinç','Rice','Reis','Рис'], sugar:['Şeker','Sugar','Zucker','Сахар'], mint:['Taze nane','Fresh mint','Frische Minze','Свежая мята'],
  lemon:['Limon','Lemon','Zitrone','Лимон'], ice:['Buz','Ice','Eis','Лёд'], yogurt:['Yoğurt','Yogurt','Joghurt','Йогурт'],
  salt:['Tuz','Salt','Salz','Соль'], peach:['Şeftali','Peach','Pfirsich','Персик'], bread:['Ekmek','Bread','Brot','Хлеб']
};

// Product detail: [Turkish text, English text, ingredient keys]
export const DETAIL = {
  'kahvalti-serpme':["Geleneksel Türk kahvaltısının tüm lezzetleri tek sofrada: peynir çeşitleri, zeytin, bal-kaymak, reçel, haşlanmış yumurta, domates, salatalık ve sıcak ekmek. İki kişilik servis edilir, çay sınırsızdır.","All the flavours of a traditional Turkish breakfast on one table: cheeses, olives, honey with clotted cream, jam, boiled eggs, fresh vegetables and warm bread. Serves two, with unlimited tea.","cheese olive honey cream jam egg tomato cucumber bread tea"],
  'kahvalti-menemen':["Tereyağında yavaşça pişirilen domates ve biberin üzerine yumurta kırılarak hazırlanan klasik Türk kahvaltısı. Sıcak tavada, yanında ekmekle gelir.","A classic Turkish breakfast of eggs gently cooked with tomatoes and peppers in butter. Served in the hot pan with bread.","tomato pepper egg cheese butter bread"],
  'kahvalti-sucuklu':["Tereyağında kızartılmış baharatlı sucuk dilimlerinin üzerine yumurta kırılır. Sıcak servis edilir, yanında ekmek bulunur.","Spicy sucuk slices fried in butter and topped with eggs. Served hot with bread.","egg sucuk butter bread"],
  'kahve-latte':["Çift shot espresso ile buharla ısıtılmış sütün yumuşak bir uyumu. Üzerinde ince bir süt köpüğü bulunur.","A smooth blend of a double-shot espresso and steamed milk, finished with a thin layer of milk foam.","espresso milk"],
  'kahve-americano':["Yumuşak içimli, hafif gövdeli filtre kahve. Gün boyu içilebilecek sade bir seçenek.","A smooth, light-bodied filter coffee. A simple choice for any time of day.","filter water"],
  'kahve-turk':["İnce çekilmiş kahve, közde cezvede pişirilir. Yanında bir parça lokum ile servis edilir.","Finely ground coffee brewed in a cezve over embers, served with a piece of Turkish delight.","ground water delight"],
  'burger-smash':["Sıcak plakada ezilerek kızartılan iki köfte, eritilmiş cheddar ve turşu brioche ekmeğinde buluşur.","Two patties smashed on a hot griddle, with melted cheddar and pickles in a brioche bun.","patty cheddar pickle bun"],
  'burger-aci':["Jalapeño ve acı sosla hazırlanan, acıyı sevenler için baharatlı burger.","A spicy burger for heat lovers, made with jalapeños and hot sauce.","patty jalapeno hotsauce cheddar bun"],
  'burger-tavuk':["Çıtır kaplamalı tavuk göğsü, taze marul ve mayonezle yumuşak ekmekte servis edilir.","Crispy-coated chicken breast with fresh lettuce and mayonnaise in a soft bun.","chicken lettuce mayo bun"],
  'pizza-margherita':["İnce hamur üzerine domates sosu, mozzarella ve taze fesleğen. İtalyan pizzanın sade ve klasik hali.","Thin dough topped with tomato sauce, mozzarella and fresh basil, the simple Italian classic.","dough tomato mozz basil"],
  'pizza-karisik':["Mantar, biber, zeytin ve sosisle hazırlanan, bol malzemeli pizza.","A generously topped pizza with mushrooms, peppers, olives and sausage.","dough tomato cheese mushroom pepper olive sausage"],
  'pizza-sucuklu':["Sucuk dilimleri, kaşar peyniri ve közlenmiş biberle hazırlanan, Türk damak tadına uygun pizza.","A pizza with sucuk slices, kashar cheese and roasted peppers.","dough sucuk kashar pepper"],
  'tatli-kunefe':["İnce tel kadayıf arasına peynir konulup kızartılır, sıcak şerbetle buluşturulur ve Antep fıstığı ile süslenir. Kaymakla sıcak servis edilir.","Crispy shredded kadayif pastry filled with cheese, soaked in syrup and topped with pistachios. Served hot with clotted cream.","kadayif cheese syrup pistachio cream"],
  'tatli-cheesecake':["Yüksek ısıda pişirilen, üstü yanık, içi akışkan ve yumuşak İspanyol usulü cheesecake. Karamel sos ile gelir.","Spanish-style baked cheesecake with a burnt top and a soft, creamy centre, served with caramel sauce.","creamcheese egg fcream sugar caramel"],
  'tatli-sutlac':["Pirinç ve sütle ağır ağır pişirilir, fırında üzeri kızartılır. Geleneksel tarifle hazırlanır.","Rice and milk slowly cooked and baked until the top turns golden, made to the traditional recipe.","milk rice sugar"],
  'icecek-limonata':["Taze sıkılmış limon, nane ve buzla her gün ev yapımı hazırlanır.","Made fresh daily from squeezed lemons, mint and ice.","lemon mint sugar ice water"],
  'icecek-ayran':["Yoğurt, su ve tuzla hazırlanan geleneksel içecek, bakır kasede köpüklü servis edilir.","A traditional drink of yogurt, water and salt, served frothy in a copper bowl.","yogurt water salt"],
  'icecek-soguk-cay':["Demlenmiş çayın şeftali veya limon aromasıyla soğutulmasıyla hazırlanır.","Brewed tea chilled with peach or lemon flavour.","tea peach lemon ice"]
};
