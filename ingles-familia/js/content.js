/* =========================================================
   CONTENIDO DEL CURSO — Inglés en Familia
   Niveles A1 → B2 (Marco Común Europeo)
   Cada unidad: palabras, frases, guía gramatical y diálogo.
   Puedes editar o agregar unidades siguiendo el mismo formato.
   ========================================================= */

const LEVELS = [
  { id: 'A1', name: 'Principiante', desc: 'Saludar, presentarte y sobrevivir el día a día', color: '#2fbf71' },
  { id: 'A2', name: 'Básico', desc: 'Trabajo, ciudad, pasado y viajes', color: '#1fa2ff' },
  { id: 'B1', name: 'Intermedio', desc: 'Planes, experiencias, opiniones y problemas', color: '#a463f2' },
  { id: 'B2', name: 'Intermedio alto', desc: 'Entrevistas, negocios, hipótesis y expresiones', color: '#ff7a45' }
];

const UNITS = [
/* ======================= A1 ======================= */
{
  id: 'a1u1', level: 'A1', icon: '👋', title: 'Saludos y presentaciones',
  grammar: {
    title: 'El verbo TO BE (ser / estar)',
    html: `<p>En inglés <b>ser</b> y <b>estar</b> son el mismo verbo: <b>to be</b>.</p>
<table><tr><td>I <b>am</b></td><td>yo soy / estoy</td></tr>
<tr><td>You <b>are</b></td><td>tú eres / estás</td></tr>
<tr><td>He / She / It <b>is</b></td><td>él / ella es / está</td></tr>
<tr><td>We / They <b>are</b></td><td>nosotros / ellos son / están</td></tr></table>
<p>En conversación se contrae: <b>I'm</b>, <b>you're</b>, <b>he's</b>, <b>she's</b>, <b>we're</b>.</p>
<p>⚠️ En inglés <b>siempre</b> se dice el sujeto: no "Am tired", sino "<b>I'm</b> tired".</p>`
  },
  words: [
    ['hello','hola'],['goodbye','adiós'],['name','nombre'],['friend','amigo'],['morning','mañana'],
    ['night','noche'],['please','por favor'],['thank you','gracias'],['yes','sí'],['fine','bien']
  ],
  phrases: [
    ['Hello, my name is Ana.','Hola, mi nombre es Ana.'],
    ['Nice to meet you.','Mucho gusto.'],
    ['How are you?','¿Cómo estás?'],
    ["I'm fine, thank you.",'Estoy bien, gracias.'],
    ['Good morning, teacher.','Buenos días, profesor.'],
    ['Where are you from?','¿De dónde eres?'],
    ["I'm from Venezuela.",'Soy de Venezuela.'],
    ['See you tomorrow.','Nos vemos mañana.']
  ],
  dialogue: {
    title: 'Conociendo a alguien', scene: 'Conoces a Emma en una reunión.',
    lines: [
      { bot: 'Hi! My name is Emma. What is your name?', es: '¡Hola! Me llamo Emma. ¿Cómo te llamas?' },
      { you: 'Hello, my name is Ana.', es: 'Hola, mi nombre es Ana. (usa tu nombre si quieres)' },
      { bot: 'Nice to meet you! Where are you from?', es: '¡Mucho gusto! ¿De dónde eres?' },
      { you: "I'm from Venezuela.", es: 'Soy de Venezuela.' },
      { bot: 'Cool! How are you today?', es: '¡Genial! ¿Cómo estás hoy?' },
      { you: "I'm fine, thank you.", es: 'Estoy bien, gracias.' }
    ]
  }
},
{
  id: 'a1u2', level: 'A1', icon: '👨‍👩‍👧‍👦', title: 'La familia',
  grammar: {
    title: 'Posesivos: my, your, his, her, our',
    html: `<table><tr><td><b>my</b></td><td>mi / mis</td></tr><tr><td><b>your</b></td><td>tu / tus / su (de usted)</td></tr>
<tr><td><b>his</b></td><td>su (de él)</td></tr><tr><td><b>her</b></td><td>su (de ella)</td></tr>
<tr><td><b>our</b></td><td>nuestro</td></tr><tr><td><b>their</b></td><td>su (de ellos)</td></tr></table>
<p>No cambian con el plural: <b>my</b> son, <b>my</b> sons.</p>
<p>Para decir "de alguien" se usa <b>'s</b>: <i>Maria<b>'s</b> brother</i> = el hermano de María.</p>`
  },
  words: [
    ['mother','madre'],['father','padre'],['son','hijo'],['daughter','hija'],['wife','esposa'],
    ['husband','esposo'],['brother','hermano'],['sister','hermana'],['family','familia'],['children','hijos / niños']
  ],
  phrases: [
    ['This is my wife.','Ella es mi esposa.'],
    ['I have two children.','Tengo dos hijos.'],
    ['My son is ten years old.','Mi hijo tiene diez años.'],
    ['Her name is Sofia.','Su nombre es Sofía.'],
    ['We are a big family.','Somos una familia grande.'],
    ['Do you have brothers or sisters?','¿Tienes hermanos o hermanas?'],
    ['My father is a teacher.','Mi padre es profesor.'],
    ['I love my family.','Amo a mi familia.']
  ],
  dialogue: {
    title: 'Hablando de tu familia', scene: 'Un compañero ve una foto en tu teléfono.',
    lines: [
      { bot: 'Is this your family?', es: '¿Esta es tu familia?' },
      { you: 'Yes, this is my wife.', es: 'Sí, ella es mi esposa.' },
      { bot: 'Beautiful! Do you have children?', es: '¡Linda! ¿Tienes hijos?' },
      { you: 'I have two children.', es: 'Tengo dos hijos.' },
      { bot: 'How old are they?', es: '¿Cuántos años tienen?' },
      { you: 'My son is ten years old.', es: 'Mi hijo tiene diez años.' }
    ]
  }
},
{
  id: 'a1u3', level: 'A1', icon: '🔢', title: 'Números y la hora',
  grammar: {
    title: 'La edad y la hora',
    html: `<p>⚠️ La edad se dice con <b>to be</b>, no con "have": <br><b>I am 40 years old</b> (no "I have 40 years").</p>
<p>La hora: <b>It's three o'clock</b> (son las 3 en punto). <b>It's half past six</b> (6:30). <b>It's a quarter to nine</b> (8:45).</p>
<p>Forma fácil: di los números: <b>It's seven thirty</b> (7:30).</p>`
  },
  words: [
    ['one','uno'],['three','tres'],['five','cinco'],['eight','ocho'],['ten','diez'],
    ['twelve','doce'],['twenty','veinte'],['hundred','cien'],['time','hora / tiempo'],['today','hoy']
  ],
  phrases: [
    ['What time is it?','¿Qué hora es?'],
    ["It's seven o'clock.",'Son las siete en punto.'],
    ['How old are you?','¿Cuántos años tienes?'],
    ['I am forty years old.','Tengo cuarenta años.'],
    ['My phone number is five five five.','Mi número de teléfono es cinco cinco cinco.'],
    ['The class is at eight.','La clase es a las ocho.'],
    ['I have three dollars.','Tengo tres dólares.'],
    ['See you at ten.','Nos vemos a las diez.']
  ],
  dialogue: {
    title: 'Preguntando la hora', scene: 'Estás en la calle y le preguntas la hora a alguien.',
    lines: [
      { you: 'Excuse me, what time is it?', es: 'Disculpe, ¿qué hora es?' },
      { bot: "It's seven o'clock.", es: 'Son las siete en punto.' },
      { you: 'Thank you. The class is at eight.', es: 'Gracias. La clase es a las ocho.' },
      { bot: "You have time! Good luck.", es: '¡Tienes tiempo! Buena suerte.' }
    ]
  }
},
{
  id: 'a1u4', level: 'A1', icon: '🍔', title: 'Comida y bebida',
  grammar: {
    title: 'I like / I want / I would like',
    html: `<p><b>I like</b> = me gusta (en general). <i>I like pizza.</i></p>
<p><b>I want</b> = quiero (directo, a veces suena brusco).</p>
<p><b>I'd like</b> (I would like) = quisiera — <b>la forma educada</b> para pedir en un restaurante.</p>
<p>Negativo: <b>I don't like</b> fish. Pregunta: <b>Do you like</b> coffee?</p>`
  },
  words: [
    ['water','agua'],['coffee','café'],['bread','pan'],['chicken','pollo'],['rice','arroz'],
    ['egg','huevo'],['juice','jugo'],['cheese','queso'],['breakfast','desayuno'],['dinner','cena']
  ],
  phrases: [
    ["I'd like a coffee, please.",'Quisiera un café, por favor.'],
    ['I like chicken and rice.','Me gusta el pollo con arroz.'],
    ["I don't like fish.",'No me gusta el pescado.'],
    ['Can I have some water?','¿Me puede dar agua?'],
    ['Breakfast is ready.','El desayuno está listo.'],
    ['Do you want juice?','¿Quieres jugo?'],
    ['The bread is very good.','El pan está muy bueno.'],
    ['The check, please.','La cuenta, por favor.']
  ],
  dialogue: {
    title: 'En la cafetería', scene: 'Pides algo en una cafetería.',
    lines: [
      { bot: 'Hi! What can I get you?', es: '¡Hola! ¿Qué le sirvo?' },
      { you: "I'd like a coffee, please.", es: 'Quisiera un café, por favor.' },
      { bot: 'Sure. Anything to eat?', es: 'Claro. ¿Algo de comer?' },
      { you: 'Yes, bread with cheese.', es: 'Sí, pan con queso.' },
      { bot: "Here you are. That's five dollars.", es: 'Aquí tiene. Son cinco dólares.' },
      { you: 'Thank you very much.', es: 'Muchas gracias.' }
    ]
  }
},
{
  id: 'a1u5', level: 'A1', icon: '🏠', title: 'Casa y rutina diaria',
  grammar: {
    title: 'Presente simple (rutinas)',
    html: `<p>Para hábitos y rutinas: <b>I work</b>, <b>I eat</b>, <b>I sleep</b>.</p>
<p>⚠️ Con <b>he / she / it</b> se agrega <b>-s</b>: <i>She work<b>s</b></i>, <i>He get<b>s</b> up</i>.</p>
<p>Negativo: <b>I don't</b> work / <b>She doesn't</b> work.</p>
<p>Palabras útiles: <b>always</b> (siempre), <b>usually</b> (normalmente), <b>never</b> (nunca), <b>every day</b> (todos los días).</p>`
  },
  words: [
    ['house','casa'],['kitchen','cocina'],['bedroom','habitación'],['bathroom','baño'],['wake up','despertarse'],
    ['work','trabajar'],['sleep','dormir'],['shower','ducha'],['every day','todos los días'],['always','siempre']
  ],
  phrases: [
    ['I wake up at six.','Me despierto a las seis.'],
    ['I take a shower every day.','Me ducho todos los días.'],
    ['She works in an office.','Ella trabaja en una oficina.'],
    ['We eat dinner at home.','Cenamos en casa.'],
    ['My house has three bedrooms.','Mi casa tiene tres habitaciones.'],
    ["He doesn't work on Sunday.",'Él no trabaja los domingos.'],
    ['I always drink coffee.','Siempre tomo café.'],
    ['I go to sleep at ten.','Me voy a dormir a las diez.']
  ],
  dialogue: {
    title: 'Tu rutina', scene: 'Un amigo te pregunta por tu día.',
    lines: [
      { bot: 'What time do you wake up?', es: '¿A qué hora te despiertas?' },
      { you: 'I wake up at six.', es: 'Me despierto a las seis.' },
      { bot: 'Wow, early! Do you drink coffee?', es: '¡Uy, temprano! ¿Tomas café?' },
      { you: 'Yes, I always drink coffee.', es: 'Sí, siempre tomo café.' },
      { bot: 'And when do you go to sleep?', es: '¿Y cuándo te vas a dormir?' },
      { you: 'I go to sleep at ten.', es: 'Me voy a dormir a las diez.' }
    ]
  }
},
{
  id: 'a1u6', level: 'A1', icon: '👕', title: 'Ropa, colores y compras',
  grammar: {
    title: 'This / That / These / Those',
    html: `<table><tr><td><b>this</b></td><td>este/esta (cerca, singular)</td></tr>
<tr><td><b>that</b></td><td>ese/esa (lejos, singular)</td></tr>
<tr><td><b>these</b></td><td>estos/estas (cerca, plural)</td></tr>
<tr><td><b>those</b></td><td>esos/esas (lejos, plural)</td></tr></table>
<p>El adjetivo va <b>antes</b> del sustantivo: <i>a <b>red</b> shirt</i> (una camisa roja).</p>
<p>Precio: <b>How much is this?</b> / <b>How much are these?</b></p>`
  },
  words: [
    ['shirt','camisa'],['shoes','zapatos'],['pants','pantalón'],['red','rojo'],['blue','azul'],
    ['black','negro'],['white','blanco'],['big','grande'],['small','pequeño'],['cheap','barato']
  ],
  phrases: [
    ['How much is this shirt?','¿Cuánto cuesta esta camisa?'],
    ['I like the blue shoes.','Me gustan los zapatos azules.'],
    ['Do you have a small size?','¿Tiene una talla pequeña?'],
    ['These pants are too big.','Estos pantalones son muy grandes.'],
    ["That's very cheap.",'Eso es muy barato.'],
    ['Can I try it on?','¿Me lo puedo probar?'],
    ["I'll take it.",'Me lo llevo.'],
    ['Do you accept cards?','¿Acepta tarjetas?']
  ],
  dialogue: {
    title: 'En la tienda', scene: 'Estás comprando ropa.',
    lines: [
      { bot: 'Hello! Can I help you?', es: '¡Hola! ¿Le puedo ayudar?' },
      { you: 'How much is this shirt?', es: '¿Cuánto cuesta esta camisa?' },
      { bot: "It's twenty dollars.", es: 'Cuesta veinte dólares.' },
      { you: 'Can I try it on?', es: '¿Me la puedo probar?' },
      { bot: 'Of course. The fitting room is there.', es: 'Claro. El probador está allí.' },
      { you: "It's perfect. I'll take it.", es: 'Es perfecta. Me la llevo.' }
    ]
  }
},
/* ======================= A2 ======================= */
{
  id: 'a2u1', level: 'A2', icon: '💼', title: 'Trabajo y oficios',
  grammar: {
    title: 'Preguntas con DO / DOES',
    html: `<p>Para preguntar en presente: <b>Do</b> + I/you/we/they, <b>Does</b> + he/she/it.</p>
<p><i><b>Do</b> you work here?</i> — <i><b>Does</b> she like her job?</i></p>
<p>⚠️ Con <b>does</b> el verbo pierde la -s: <i>Does he work<b>(✗s)</b>?</i></p>
<p>"¿A qué te dedicas?" = <b>What do you do?</b> (no "What is your work?").</p>`
  },
  words: [
    ['job','trabajo / empleo'],['boss','jefe'],['engineer','ingeniero'],['doctor','médico'],['company','empresa'],
    ['meeting','reunión'],['salary','salario'],['office','oficina'],['customer','cliente'],['busy','ocupado']
  ],
  phrases: [
    ['What do you do?','¿A qué te dedicas?'],
    ["I'm an engineer.",'Soy ingeniero.'],
    ['I work for a small company.','Trabajo para una empresa pequeña.'],
    ['Does she like her job?','¿A ella le gusta su trabajo?'],
    ['I have a meeting at nine.','Tengo una reunión a las nueve.'],
    ["I'm very busy today.",'Estoy muy ocupado hoy.'],
    ['My boss is very nice.','Mi jefe es muy amable.'],
    ['We have many customers.','Tenemos muchos clientes.']
  ],
  dialogue: {
    title: 'Small talk de trabajo', scene: 'Conoces a alguien en un evento.',
    lines: [
      { bot: 'So, what do you do?', es: 'Y, ¿a qué te dedicas?' },
      { you: "I'm an engineer.", es: 'Soy ingeniero.' },
      { bot: 'Interesting! Do you work for a big company?', es: '¡Interesante! ¿Trabajas para una empresa grande?' },
      { you: 'I work for a small company.', es: 'Trabajo para una empresa pequeña.' },
      { bot: 'Do you like your job?', es: '¿Te gusta tu trabajo?' },
      { you: "Yes, but I'm very busy.", es: 'Sí, pero estoy muy ocupado.' }
    ]
  }
},
{
  id: 'a2u2', level: 'A2', icon: '🗺️', title: 'Ciudad y direcciones',
  grammar: {
    title: 'There is / There are',
    html: `<p>Para decir "hay": <b>There is</b> (singular) / <b>There are</b> (plural).</p>
<p><i>There's a bank near here.</i> — <i>There are two supermarkets.</i></p>
<p>Pregunta: <b>Is there</b> a pharmacy near here?</p>
<p>Direcciones: <b>turn left</b> (gira a la izquierda), <b>turn right</b>, <b>go straight</b> (sigue derecho), <b>next to</b> (al lado de), <b>across from</b> (frente a).</p>`
  },
  words: [
    ['street','calle'],['bank','banco'],['pharmacy','farmacia'],['left','izquierda'],['right','derecha'],
    ['near','cerca'],['far','lejos'],['corner','esquina'],['bus stop','parada de autobús'],['straight','derecho']
  ],
  phrases: [
    ['Is there a pharmacy near here?','¿Hay una farmacia cerca de aquí?'],
    ['Go straight and turn left.','Sigue derecho y gira a la izquierda.'],
    ["It's next to the bank.",'Está al lado del banco.'],
    ['Where is the bus stop?','¿Dónde está la parada de autobús?'],
    ["It's on the corner.",'Está en la esquina.'],
    ['Is it far from here?','¿Está lejos de aquí?'],
    ['There are two banks on this street.','Hay dos bancos en esta calle.'],
    ["Sorry, I'm not from here.",'Lo siento, no soy de aquí.']
  ],
  dialogue: {
    title: 'Buscando una farmacia', scene: 'Estás perdido en una ciudad.',
    lines: [
      { you: 'Excuse me, is there a pharmacy near here?', es: 'Disculpe, ¿hay una farmacia cerca de aquí?' },
      { bot: 'Yes. Go straight and turn left at the corner.', es: 'Sí. Siga derecho y gire a la izquierda en la esquina.' },
      { you: 'Is it far from here?', es: '¿Está lejos de aquí?' },
      { bot: "No, it's a five minute walk. It's next to the bank.", es: 'No, a cinco minutos caminando. Está al lado del banco.' },
      { you: 'Thank you so much.', es: 'Muchísimas gracias.' }
    ]
  }
},
{
  id: 'a2u3', level: 'A2', icon: '📅', title: 'El fin de semana pasado',
  grammar: {
    title: 'Pasado simple',
    html: `<p>Verbos regulares: agrega <b>-ed</b>: work → work<b>ed</b>, play → play<b>ed</b>, visit → visit<b>ed</b>.</p>
<p>Irregulares importantes: go → <b>went</b>, eat → <b>ate</b>, see → <b>saw</b>, have → <b>had</b>, buy → <b>bought</b>, make → <b>made</b>.</p>
<p>Pregunta y negativo con <b>did</b> (y el verbo vuelve a su forma base): <i><b>Did</b> you <b>go</b>?</i> — <i>I <b>didn't go</b>.</i></p>
<p>🔊 La -ed casi nunca suena "ed": worked = "workt", played = "pleid". Solo suena "id" después de t/d: visit<b>ed</b>.</p>`
  },
  words: [
    ['yesterday','ayer'],['last week','la semana pasada'],['went','fue / fui'],['ate','comió / comí'],['saw','vio / vi'],
    ['bought','compró / compré'],['beach','playa'],['movie','película'],['weekend','fin de semana'],['visited','visitó / visité']
  ],
  phrases: [
    ['What did you do last weekend?','¿Qué hiciste el fin de semana pasado?'],
    ['We went to the beach.','Fuimos a la playa.'],
    ['I visited my parents.','Visité a mis padres.'],
    ['We saw a movie on Saturday.','Vimos una película el sábado.'],
    ["I didn't go out.",'No salí.'],
    ['Did you have a good time?','¿La pasaste bien?'],
    ['She bought new shoes.','Ella compró zapatos nuevos.'],
    ['We ate at a restaurant.','Comimos en un restaurante.']
  ],
  dialogue: {
    title: 'Lunes por la mañana', scene: 'Un compañero te pregunta por tu fin de semana.',
    lines: [
      { bot: 'Hey! What did you do last weekend?', es: '¡Hola! ¿Qué hiciste el fin de semana pasado?' },
      { you: 'We went to the beach.', es: 'Fuimos a la playa.' },
      { bot: 'Nice! Did you have a good time?', es: '¡Qué bien! ¿La pasaron bien?' },
      { you: 'Yes, and we ate at a restaurant.', es: 'Sí, y comimos en un restaurante.' },
      { bot: 'Sounds great. I just stayed home.', es: 'Suena genial. Yo me quedé en casa.' }
    ]
  }
},
{
  id: 'a2u4', level: 'A2', icon: '🩺', title: 'Salud y el cuerpo',
  grammar: {
    title: 'Síntomas y consejos con SHOULD',
    html: `<p>Síntomas: <b>I have a</b> headache / cold / fever. <b>My</b> back <b>hurts</b>.</p>
<p>Consejos: <b>should</b> + verbo = deberías.<br><i>You <b>should</b> rest.</i> — <i>You <b>shouldn't</b> work today.</i></p>
<p>Should nunca lleva "to" ni "-s": <i>She should go</i> (no "she shoulds to go").</p>`
  },
  words: [
    ['head','cabeza'],['back','espalda'],['stomach','estómago'],['fever','fiebre'],['cold','resfriado'],
    ['medicine','medicina'],['hurt','doler'],['rest','descansar'],['sick','enfermo'],['appointment','cita']
  ],
  phrases: [
    ['I have a headache.','Tengo dolor de cabeza.'],
    ['My back hurts.','Me duele la espalda.'],
    ['You should rest.','Deberías descansar.'],
    ['I feel sick today.','Me siento mal hoy.'],
    ['I need an appointment with the doctor.','Necesito una cita con el médico.'],
    ['Take this medicine twice a day.','Tome esta medicina dos veces al día.'],
    ["You shouldn't eat too much sugar.",'No deberías comer mucha azúcar.'],
    ['I think I have a cold.','Creo que tengo un resfriado.']
  ],
  dialogue: {
    title: 'En la consulta', scene: 'Vas al médico.',
    lines: [
      { bot: 'Hello. What seems to be the problem?', es: 'Hola. ¿Cuál parece ser el problema?' },
      { you: 'I feel sick today. I have a headache.', es: 'Me siento mal hoy. Tengo dolor de cabeza.' },
      { bot: 'Do you have a fever?', es: '¿Tiene fiebre?' },
      { you: 'Yes, and my back hurts.', es: 'Sí, y me duele la espalda.' },
      { bot: 'I think you have a cold. You should rest and drink water.', es: 'Creo que tiene un resfriado. Debería descansar y tomar agua.' },
      { you: 'Thank you, doctor.', es: 'Gracias, doctor.' }
    ]
  }
},
{
  id: 'a2u5', level: 'A2', icon: '✈️', title: 'Viajes y aeropuerto',
  grammar: {
    title: 'Futuro con GOING TO y peticiones con CAN',
    html: `<p>Planes: <b>am/is/are going to</b> + verbo.<br><i>I'm <b>going to</b> travel to Miami.</i></p>
<p>Pedir algo: <b>Can I</b> have a window seat? / <b>Could you</b> help me? (más educado)</p>
<p>En el aeropuerto: <b>boarding pass</b> (pase de abordar), <b>gate</b> (puerta), <b>luggage</b> (equipaje), <b>flight</b> (vuelo).</p>`
  },
  words: [
    ['flight','vuelo'],['passport','pasaporte'],['luggage','equipaje'],['gate','puerta de embarque'],['ticket','boleto'],
    ['hotel','hotel'],['seat','asiento'],['delayed','retrasado'],['trip','viaje'],['arrive','llegar']
  ],
  phrases: [
    ["I'm going to travel to Miami.",'Voy a viajar a Miami.'],
    ['Can I see your passport?','¿Puedo ver su pasaporte?'],
    ['Can I have a window seat?','¿Me puede dar un asiento de ventana?'],
    ['Where is gate twelve?','¿Dónde está la puerta doce?'],
    ['My flight is delayed.','Mi vuelo está retrasado.'],
    ['I have one bag to check.','Tengo una maleta para documentar.'],
    ["I'm here on a business trip.",'Estoy aquí en viaje de negocios.'],
    ['I have a reservation at this hotel.','Tengo una reservación en este hotel.']
  ],
  dialogue: {
    title: 'Check-in en el aeropuerto', scene: 'Llegas al mostrador de la aerolínea.',
    lines: [
      { bot: 'Good morning. Can I see your passport, please?', es: 'Buenos días. ¿Puedo ver su pasaporte, por favor?' },
      { you: 'Sure, here you are.', es: 'Claro, aquí tiene.' },
      { bot: 'Do you have any bags to check?', es: '¿Tiene maletas para documentar?' },
      { you: 'I have one bag to check.', es: 'Tengo una maleta para documentar.' },
      { bot: 'Window or aisle seat?', es: '¿Asiento de ventana o de pasillo?' },
      { you: 'Can I have a window seat?', es: '¿Me puede dar un asiento de ventana?' },
      { bot: 'Of course. Your gate is twelve. Have a nice flight!', es: 'Claro. Su puerta es la doce. ¡Buen vuelo!' }
    ]
  }
},
/* ======================= B1 ======================= */
{
  id: 'b1u1', level: 'B1', icon: '🗓️', title: 'Planes y futuro',
  grammar: {
    title: 'WILL vs GOING TO vs presente continuo',
    html: `<p><b>Will</b>: decisiones del momento, promesas, predicciones. <i>I'll call you later.</i></p>
<p><b>Going to</b>: planes ya decididos. <i>We're going to buy a car.</i></p>
<p><b>Presente continuo</b>: citas con fecha y hora. <i>I'm meeting my boss tomorrow.</i></p>
<p>Con <b>if / when</b> se usa presente, no will: <i>When I <b>arrive</b>, I'll call you.</i></p>`
  },
  words: [
    ['plan','plan'],['next year','el próximo año'],['probably','probablemente'],['promise','prometer'],['tomorrow','mañana (día)'],
    ['decide','decidir'],['soon','pronto'],['goal','meta'],['save money','ahorrar dinero'],['hope','esperar / ojalá']
  ],
  phrases: [
    ["I'll call you later.",'Te llamo más tarde.'],
    ["We're going to buy a new car.",'Vamos a comprar un carro nuevo.'],
    ["I'm meeting my boss tomorrow.",'Me reúno con mi jefe mañana.'],
    ['It will probably rain tonight.','Probablemente llueva esta noche.'],
    ['What are your plans for next year?','¿Cuáles son tus planes para el próximo año?'],
    ['I hope to learn English soon.','Espero aprender inglés pronto.'],
    ["I promise I won't be late.",'Te prometo que no llegaré tarde.'],
    ["When I arrive, I'll send you a message.",'Cuando llegue, te mando un mensaje.']
  ],
  dialogue: {
    title: 'Planes del año', scene: 'Un amigo te pregunta por tus metas.',
    lines: [
      { bot: 'So, what are your plans for next year?', es: 'Entonces, ¿cuáles son tus planes para el próximo año?' },
      { you: "We're going to buy a new car.", es: 'Vamos a comprar un carro nuevo.' },
      { bot: "That's exciting! Anything else?", es: '¡Qué emoción! ¿Algo más?' },
      { you: 'I hope to learn English soon.', es: 'Espero aprender inglés pronto.' },
      { bot: "You will! You're doing great. Let's talk again next week.", es: '¡Lo lograrás! Vas muy bien. Hablemos de nuevo la próxima semana.' },
      { you: "Sure, I'll call you later.", es: 'Claro, te llamo más tarde.' }
    ]
  }
},
{
  id: 'b1u2', level: 'B1', icon: '🌎', title: 'Experiencias de vida',
  grammar: {
    title: 'Presente perfecto: HAVE + participio',
    html: `<p>Para experiencias sin fecha exacta: <i>I <b>have been</b> to Miami.</i> <i>She <b>has never eaten</b> sushi.</i></p>
<p><b>Have you ever...?</b> = ¿Alguna vez has...?</p>
<p>⚠️ Si dices <b>cuándo</b>, usa pasado simple: <i>I went to Miami <b>in 2019</b></i> (no "I have been in 2019").</p>
<p>Participios útiles: been, seen, eaten, done, tried, lived, worked.</p>`
  },
  words: [
    ['ever','alguna vez'],['never','nunca'],['already','ya'],['yet','todavía / ya (pregunta)'],['experience','experiencia'],
    ['abroad','en el extranjero'],['tried','probado'],['been','estado / ido'],['since','desde'],['lived','vivido']
  ],
  phrases: [
    ['Have you ever been to New York?','¿Alguna vez has ido a Nueva York?'],
    ["I've never eaten sushi.",'Nunca he comido sushi.'],
    ["I've already finished my homework.",'Ya terminé mi tarea.'],
    ["Have you finished yet?",'¿Ya terminaste?'],
    ["We've lived here since two thousand ten.",'Vivimos aquí desde el dos mil diez.'],
    ['She has worked abroad.','Ella ha trabajado en el extranjero.'],
    ["I've tried many times.",'Lo he intentado muchas veces.'],
    ["It's the best movie I've ever seen.",'Es la mejor película que he visto.']
  ],
  dialogue: {
    title: '¿Alguna vez...?', scene: 'Conversación relajada con un colega.',
    lines: [
      { bot: 'Have you ever been to the United States?', es: '¿Alguna vez has ido a Estados Unidos?' },
      { you: "Yes, I've been to Miami many times.", es: 'Sí, he ido a Miami muchas veces.' },
      { bot: 'Cool. Have you ever tried Japanese food?', es: 'Genial. ¿Alguna vez has probado comida japonesa?' },
      { you: "No, I've never eaten sushi.", es: 'No, nunca he comido sushi.' },
      { bot: "You should try it! It's delicious.", es: '¡Deberías probarlo! Es delicioso.' }
    ]
  }
},
{
  id: 'b1u3', level: 'B1', icon: '🍽️', title: 'Restaurante y peticiones educadas',
  grammar: {
    title: 'Ser cortés: COULD, WOULD, WOULD YOU MIND',
    html: `<p>Más directo → más educado:<br><i>Give me the menu.</i> 😬 → <i>Can I have the menu?</i> 🙂 → <i><b>Could I</b> have the menu, please?</i> 😊</p>
<p><b>Would you mind</b> + verbo-<b>ing</b>: <i>Would you mind clos<b>ing</b> the window?</i></p>
<p>Para quejarse con educación: <i>I'm sorry, but my food is cold.</i> / <i>I'm afraid there's a mistake in the bill.</i></p>`
  },
  words: [
    ['menu','menú'],['waiter','mesero'],['order','pedir / pedido'],['bill','cuenta'],['mistake','error'],
    ['table','mesa'],['tip','propina'],['spicy','picante'],['cold','frío'],['recommend','recomendar']
  ],
  phrases: [
    ['Could I have the menu, please?','¿Me podría dar el menú, por favor?'],
    ['A table for four, please.','Una mesa para cuatro, por favor.'],
    ['What do you recommend?','¿Qué recomienda?'],
    ["I'm sorry, but my food is cold.",'Disculpe, pero mi comida está fría.'],
    ["I think there's a mistake in the bill.",'Creo que hay un error en la cuenta.'],
    ['Would you mind bringing more water?','¿Le molestaría traer más agua?'],
    ['Is it spicy?','¿Es picante?'],
    ['Are you ready to order?','¿Están listos para pedir?']
  ],
  dialogue: {
    title: 'Cena familiar', scene: 'Llegas a un restaurante con tu familia.',
    lines: [
      { bot: 'Good evening! How many people?', es: '¡Buenas noches! ¿Cuántas personas?' },
      { you: 'A table for four, please.', es: 'Una mesa para cuatro, por favor.' },
      { bot: 'Right this way. Are you ready to order?', es: 'Por aquí. ¿Están listos para pedir?' },
      { you: 'What do you recommend?', es: '¿Qué recomienda?' },
      { bot: 'The grilled chicken is very popular.', es: 'El pollo a la parrilla es muy popular.' },
      { you: "Great. And would you mind bringing more water?", es: 'Perfecto. ¿Y le molestaría traer más agua?' }
    ]
  }
},
{
  id: 'b1u4', level: 'B1', icon: '📱', title: 'Tecnología y problemas',
  grammar: {
    title: 'Describir problemas',
    html: `<p><b>It doesn't work</b> = no funciona. <b>It stopped working</b> = dejó de funcionar.</p>
<p><b>I can't</b> + verbo: <i>I can't log in</i> (no puedo entrar).</p>
<p>Presente perfecto para resultados: <i>I've forgotten my password.</i> / <i>The screen has frozen.</i></p>
<p>Pedir ayuda: <i>Could you help me with...?</i> / <i>Have you tried restarting it?</i> (try + -ing)</p>`
  },
  words: [
    ['password','contraseña'],['screen','pantalla'],['charger','cargador'],['download','descargar'],['update','actualizar'],
    ['battery','batería'],['account','cuenta'],['restart','reiniciar'],['broken','roto / dañado'],['signal','señal']
  ],
  phrases: [
    ["My phone doesn't work.",'Mi teléfono no funciona.'],
    ["I can't log in to my account.",'No puedo entrar a mi cuenta.'],
    ["I've forgotten my password.",'Olvidé mi contraseña.'],
    ['Have you tried restarting it?','¿Has intentado reiniciarlo?'],
    ['The battery dies very fast.','La batería se descarga muy rápido.'],
    ['The screen is broken.','La pantalla está rota.'],
    ["There's no signal here.",'Aquí no hay señal.'],
    ['You need to update the app.','Necesitas actualizar la app.']
  ],
  dialogue: {
    title: 'Soporte técnico', scene: 'Llamas a soporte por un problema.',
    lines: [
      { bot: 'Tech support, how can I help you?', es: 'Soporte técnico, ¿en qué le puedo ayudar?' },
      { you: "I can't log in to my account.", es: 'No puedo entrar a mi cuenta.' },
      { bot: 'Do you remember your password?', es: '¿Recuerda su contraseña?' },
      { you: "No, I've forgotten my password.", es: 'No, olvidé mi contraseña.' },
      { bot: "No problem. I'll send you a link to reset it.", es: 'No hay problema. Le enviaré un enlace para restablecerla.' },
      { you: 'Perfect, thank you for your help.', es: 'Perfecto, gracias por su ayuda.' }
    ]
  }
},
{
  id: 'b1u5', level: 'B1', icon: '💬', title: 'Opiniones y acuerdos',
  grammar: {
    title: 'Dar tu opinión',
    html: `<p>Opinar: <b>I think</b>... / <b>In my opinion</b>... / <b>I believe</b>...</p>
<p>Acordar: <b>I agree</b> (¡no "I'm agree"!) / <b>Exactly</b> / <b>That's true</b>.</p>
<p>Desacuerdo suave: <b>I see your point, but</b>... / <b>I'm not sure about that</b>.</p>
<p>Comparar: <i>bigger <b>than</b></i>, <i><b>more</b> expensive <b>than</b></i>, <i><b>the best</b></i>.</p>`
  },
  words: [
    ['opinion','opinión'],['agree','estar de acuerdo'],['disagree','no estar de acuerdo'],['important','importante'],['better','mejor'],
    ['worse','peor'],['expensive','caro'],['reason','razón / motivo'],['however','sin embargo'],['because','porque']
  ],
  phrases: [
    ['In my opinion, it is too expensive.','En mi opinión, es demasiado caro.'],
    ['I agree with you.','Estoy de acuerdo contigo.'],
    ['I see your point, but I disagree.','Entiendo tu punto, pero no estoy de acuerdo.'],
    ['I think English is very important.','Creo que el inglés es muy importante.'],
    ['This one is better than that one.','Este es mejor que aquel.'],
    ["I'm not sure about that.",'No estoy seguro de eso.'],
    ['What do you think?','¿Qué opinas?'],
    ['That is a good reason.','Esa es una buena razón.']
  ],
  dialogue: {
    title: 'Debate en la cena', scene: 'Hablan sobre aprender idiomas.',
    lines: [
      { bot: 'Do you think everyone should learn English?', es: '¿Crees que todos deberían aprender inglés?' },
      { you: 'I think English is very important.', es: 'Creo que el inglés es muy importante.' },
      { bot: 'But classes are expensive, right?', es: 'Pero las clases son caras, ¿no?' },
      { you: "I see your point, but apps are cheaper.", es: 'Entiendo tu punto, pero las apps son más baratas.' },
      { bot: "That's true. Practicing every day is the key.", es: 'Es cierto. Practicar todos los días es la clave.' },
      { you: 'I agree with you.', es: 'Estoy de acuerdo contigo.' }
    ]
  }
},
/* ======================= B2 ======================= */
{
  id: 'b2u1', level: 'B2', icon: '🤝', title: 'Entrevista de trabajo',
  grammar: {
    title: 'Presente perfecto continuo',
    html: `<p><b>have been + -ing</b>: algo que empezó en el pasado y continúa.<br><i>I<b>'ve been working</b> as an engineer for fifteen years.</i></p>
<p><b>for</b> + duración (for ten years) / <b>since</b> + punto de inicio (since 2010).</p>
<p>Frases potentes de entrevista: <i>I'm good at...</i>, <i>I'm responsible for...</i>, <i>I'm looking for new challenges.</i></p>`
  },
  words: [
    ['strength','fortaleza'],['weakness','debilidad'],['skills','habilidades'],['experience','experiencia'],['team','equipo'],
    ['challenge','reto'],['responsible for','encargado de'],['achieve','lograr'],['manage','gestionar / dirigir'],['hire','contratar']
  ],
  phrases: [
    ["I've been working as an engineer for fifteen years.",'Llevo quince años trabajando como ingeniero.'],
    ["I'm responsible for a team of ten people.",'Estoy a cargo de un equipo de diez personas.'],
    ['My greatest strength is solving problems.','Mi mayor fortaleza es resolver problemas.'],
    ["I'm looking for new challenges.",'Busco nuevos retos.'],
    ['I managed a project from start to finish.','Dirigí un proyecto de principio a fin.'],
    ['Why should we hire you?','¿Por qué deberíamos contratarte?'],
    ['I work well under pressure.','Trabajo bien bajo presión.'],
    ['Do you have any questions for us?','¿Tiene alguna pregunta para nosotros?']
  ],
  dialogue: {
    title: 'La entrevista', scene: 'Una entrevista de trabajo en inglés.',
    lines: [
      { bot: 'Tell me a little about yourself.', es: 'Cuénteme un poco sobre usted.' },
      { you: "I've been working as an engineer for fifteen years.", es: 'Llevo quince años trabajando como ingeniero.' },
      { bot: 'Impressive. What is your greatest strength?', es: 'Impresionante. ¿Cuál es su mayor fortaleza?' },
      { you: 'My greatest strength is solving problems.', es: 'Mi mayor fortaleza es resolver problemas.' },
      { bot: 'And why do you want this job?', es: '¿Y por qué quiere este trabajo?' },
      { you: "I'm looking for new challenges.", es: 'Busco nuevos retos.' }
    ]
  }
},
{
  id: 'b2u2', level: 'B2', icon: '📦', title: 'Negocios e importación',
  grammar: {
    title: 'Condicional 1 y lenguaje de negociación',
    html: `<p><b>If + presente, will + verbo</b>: <i>If you <b>order</b> two containers, we<b>'ll give</b> you a discount.</i></p>
<p>Suavizar en negociación: <i>Would it be possible to...?</i> / <i>We were hoping for...</i> / <i>Could you do better on the price?</i></p>
<p>Vocabulario de comercio: <b>quote</b> (cotización), <b>lead time</b> (tiempo de producción), <b>shipment</b> (embarque), <b>deposit</b> (anticipo).</p>`
  },
  words: [
    ['quote','cotización'],['shipment','embarque'],['supplier','proveedor'],['deadline','fecha límite'],['discount','descuento'],
    ['deposit','anticipo'],['warranty','garantía'],['invoice','factura'],['spare parts','repuestos'],['lead time','tiempo de entrega']
  ],
  phrases: [
    ['Could you send me a quote?','¿Me podría enviar una cotización?'],
    ["What's the lead time for this machine?",'¿Cuál es el tiempo de entrega de esta máquina?'],
    ["If we order two units, will you give us a discount?",'Si pedimos dos unidades, ¿nos dan un descuento?'],
    ['Could you do better on the price?','¿Podría mejorar el precio?'],
    ['We need the shipment before the deadline.','Necesitamos el embarque antes de la fecha límite.'],
    ['Does it include spare parts and warranty?','¿Incluye repuestos y garantía?'],
    ['We will pay a thirty percent deposit.','Pagaremos un anticipo del treinta por ciento.'],
    ['Please send the invoice by email.','Por favor envíe la factura por correo.']
  ],
  dialogue: {
    title: 'Negociando con un proveedor', scene: 'Videollamada con un proveedor de maquinaria.',
    lines: [
      { bot: 'Thanks for your interest in our pellet machines. How can I help?', es: 'Gracias por su interés en nuestras peletizadoras. ¿Cómo le puedo ayudar?' },
      { you: 'Could you send me a quote?', es: '¿Me podría enviar una cotización?' },
      { bot: "Of course. It's eight thousand dollars per unit.", es: 'Claro. Son ocho mil dólares por unidad.' },
      { you: 'If we order two units, will you give us a discount?', es: 'Si pedimos dos unidades, ¿nos dan un descuento?' },
      { bot: 'We can offer five percent off for two units.', es: 'Podemos ofrecer cinco por ciento de descuento por dos unidades.' },
      { you: 'Does it include spare parts and warranty?', es: '¿Incluye repuestos y garantía?' },
      { bot: 'Yes, one year warranty and a basic spare parts kit.', es: 'Sí, un año de garantía y un kit básico de repuestos.' }
    ]
  }
},
{
  id: 'b2u3', level: 'B2', icon: '💭', title: 'Hipótesis y deseos',
  grammar: {
    title: 'Condicional 2, 3 y I WISH',
    html: `<p><b>2º condicional</b> (imaginario): <i>If I <b>had</b> more time, I <b>would travel</b> more.</i></p>
<p><b>3er condicional</b> (pasado que no pasó): <i>If I <b>had studied</b>, I <b>would have passed</b>.</i></p>
<p><b>I wish</b> + pasado = ojalá (presente): <i>I wish I <b>spoke</b> English better.</i></p>
<p>Con "to be" se usa <b>were</b>: <i>If I <b>were</b> you, I would accept.</i></p>`
  },
  words: [
    ['wish','desear / ojalá'],['if','si (condicional)'],['would','(condicional) -ría'],['imagine','imaginar'],['lottery','lotería'],
    ['regret','arrepentirse'],['instead','en su lugar'],['chance','oportunidad'],['afford','poder pagar'],['decision','decisión']
  ],
  phrases: [
    ['If I had more time, I would travel more.','Si tuviera más tiempo, viajaría más.'],
    ['If I were you, I would accept the offer.','Yo que tú, aceptaría la oferta.'],
    ['I wish I spoke English better.','Ojalá hablara mejor inglés.'],
    ['If I won the lottery, I would buy a farm.','Si me ganara la lotería, compraría una finca.'],
    ['If I had studied, I would have passed.','Si hubiera estudiado, habría aprobado.'],
    ["We can't afford it right now.",'No nos alcanza en este momento.'],
    ["I don't regret my decision.",'No me arrepiento de mi decisión.'],
    ['What would you do in my place?','¿Qué harías tú en mi lugar?']
  ],
  dialogue: {
    title: '¿Qué harías si...?', scene: 'Conversación imaginativa con un amigo.',
    lines: [
      { bot: 'What would you do if you won the lottery?', es: '¿Qué harías si ganaras la lotería?' },
      { you: 'If I won the lottery, I would buy a farm.', es: 'Si me ganara la lotería, compraría una finca.' },
      { bot: 'Nice! Do you have any regrets in life?', es: '¡Bien! ¿Tienes algún arrepentimiento en la vida?' },
      { you: 'I wish I spoke English better.', es: 'Ojalá hablara mejor inglés.' },
      { bot: "Well, you're working on it right now!", es: '¡Bueno, estás trabajando en eso ahora mismo!' }
    ]
  }
},
{
  id: 'b2u4', level: 'B2', icon: '🔥', title: 'Phrasal verbs y expresiones',
  grammar: {
    title: 'Phrasal verbs: verbo + partícula',
    html: `<p>Un <b>phrasal verb</b> cambia de significado con la partícula:</p>
<table><tr><td><b>figure out</b></td><td>descifrar / resolver</td></tr>
<tr><td><b>run out of</b></td><td>quedarse sin</td></tr><tr><td><b>catch up</b></td><td>ponerse al día</td></tr>
<tr><td><b>give up</b></td><td>rendirse</td></tr><tr><td><b>look forward to</b></td><td>tener ganas de</td></tr>
<tr><td><b>set up</b></td><td>montar / configurar</td></tr></table>
<p>Son la clave para entender a los nativos: los usan muchísimo más que los verbos "formales".</p>`
  },
  words: [
    ['figure out','descifrar'],['run out of','quedarse sin'],['catch up','ponerse al día'],['give up','rendirse'],['set up','instalar / montar'],
    ['look forward to','tener ganas de'],['break down','averiarse'],['find out','averiguar'],['get along','llevarse bien'],['come up with','idear / proponer']
  ],
  phrases: [
    ["Let's figure out the problem together.",'Resolvamos el problema juntos.'],
    ["We've run out of coffee.",'Se nos acabó el café.'],
    ["Don't give up, you're almost there.",'No te rindas, ya casi lo logras.'],
    ['I look forward to hearing from you.','Quedo atento a su respuesta.'],
    ['The machine broke down yesterday.','La máquina se averió ayer.'],
    ['Let me find out and call you back.','Déjame averiguar y te devuelvo la llamada.'],
    ['I get along well with my kids.','Me llevo bien con mis hijos.'],
    ["Let's catch up next week.",'Pongámonos al día la próxima semana.']
  ],
  dialogue: {
    title: 'Un día complicado', scene: 'Un colega te llama con un problema.',
    lines: [
      { bot: 'Hey, bad news. The extruder broke down this morning.', es: 'Oye, malas noticias. La extrusora se averió esta mañana.' },
      { you: "Let's figure out the problem together.", es: 'Resolvamos el problema juntos.' },
      { bot: 'Sure. Also, we ran out of spare parts.', es: 'Claro. Además, se nos acabaron los repuestos.' },
      { you: 'Let me find out and call you back.', es: 'Déjame averiguar y te devuelvo la llamada.' },
      { bot: 'Thanks. I really appreciate it.', es: 'Gracias. De verdad lo aprecio.' },
      { you: "Don't worry. Let's catch up tomorrow.", es: 'No te preocupes. Nos ponemos al día mañana.' }
    ]
  }
}
];

/* ============ LABORATORIO DE PRONUNCIACIÓN (estilo ELSA) ============
   Sonidos que más le cuestan a quien habla español. */
const SOUNDS = [
  { id: 'th1', ipa: '/θ/', title: 'TH suave (think)', icon: '👅',
    tip: 'Pon la punta de la lengua <b>entre los dientes</b> y sopla aire, sin voz. Como la "z" de España. No es "t" ni "f".',
    pairs: [['thin','tin'],['three','tree'],['thank','tank'],['bath','bat']],
    words: ['think','three','thank you','mouth','birthday','month'],
    twister: 'I think three thousand thoughts.' },
  { id: 'th2', ipa: '/ð/', title: 'TH con voz (this)', icon: '🗣️',
    tip: 'Igual que la anterior (lengua entre los dientes) pero <b>con vibración</b> en la garganta. Parecida a la "d" suave de "nada".',
    pairs: [['they','day'],['those','doze'],['then','den'],['breathe','breed']],
    words: ['this','that','mother','father','brother','weather'],
    twister: 'This is the brother of that mother.' },
  { id: 'vb', ipa: '/v/ vs /b/', title: 'V y B son distintas', icon: '🦷',
    tip: 'En inglés la <b>V</b> se hace con los <b>dientes de arriba sobre el labio de abajo</b> (vibra). La <b>B</b> se hace juntando ambos labios.',
    pairs: [['very','berry'],['vote','boat'],['van','ban'],['vest','best']],
    words: ['very','video','seven','have','love','travel'],
    twister: 'Vicky loves very vivid videos.' },
  { id: 'ii', ipa: '/ɪ/ vs /iː/', title: 'I corta vs I larga', icon: '⏱️',
    tip: 'La <b>i corta</b> (/ɪ/, ship) es relajada, casi entre "i" y "e". La <b>i larga</b> (/iː/, sheep) es una "i" estirada y sonriente.',
    pairs: [['ship','sheep'],['live','leave'],['sit','seat'],['fill','feel']],
    words: ['big','sister','fifteen','meeting','people','teacher'],
    twister: 'Six sheep sleep on the ship.' },
  { id: 'ae', ipa: '/æ/ vs /ʌ/', title: 'A abierta (cat) vs A corta (cut)', icon: '😮',
    tip: '<b>/æ/</b> (cat): abre mucho la boca como diciendo "a" mientras sonríes, suena entre "a" y "e". <b>/ʌ/</b> (cut): una "a" corta y relajada.',
    pairs: [['cat','cut'],['bag','bug'],['hat','hut'],['ran','run']],
    words: ['apple','family','thanks','bus','money','husband'],
    twister: 'The black cat sat on a fat hat.' },
  { id: 'sh', ipa: '/ʃ/ vs /tʃ/', title: 'SH vs CH', icon: '🤫',
    tip: '<b>SH</b> es el sonido de "¡shhh!" (silencio), continuo. <b>CH</b> es como en español "chico", explosivo y corto.',
    pairs: [['shoe','chew'],['ship','chip'],['share','chair'],['wash','watch']],
    words: ['shop','English','shower','chicken','teacher','kitchen'],
    twister: 'She sells cheap shoes and chips.' },
  { id: 'sc', ipa: 's + consonante', title: 'Sin "e" al inicio (school)', icon: '🚫',
    tip: 'En español decimos "<b>e</b>scuela", pero en inglés <b>no hay e</b>: <i>school</i>, no "eschool". Empieza directo con un "sss".',
    pairs: [['school','eschool'],['speak','espeak'],['study','estudy'],['street','estreet']], noListen: true,
    words: ['school','speak','Spanish','student','star','sleep'],
    twister: 'Steve speaks Spanish at school.' },
  { id: 'ed', ipa: '-ed', title: 'Terminación -ED', icon: '⏮️',
    tip: 'La -ed suena <b>/t/</b> después de sonidos sordos (worked = "workt"), <b>/d/</b> después de sonidos con voz (played = "pleid") y <b>/ɪd/</b> solo después de t o d (wanted).',
    pairs: [['worked','work'],['played','play'],['watched','watch'],['wanted','want']],
    words: ['worked','played','watched','wanted','needed','called'],
    twister: 'I worked, I played and I wanted more.' },
  { id: 'h', ipa: '/h/', title: 'H suave (no es J)', icon: '💨',
    tip: 'La <b>H</b> inglesa es solo <b>aire suave</b>, como empañar un espejo. No es la "j" fuerte del español.',
    pairs: [['hat','at'],['hear','ear'],['hold','old'],['hate','eight']],
    words: ['hello','house','happy','hospital','husband','behind'],
    twister: 'Harry has a happy horse at home.' },
  { id: 'w', ipa: '/w/ y /dʒ/', title: 'W, Y y J', icon: '🎯',
    tip: '<b>W</b>: labios redondos como "u" (water ≠ "guater"). <b>J</b> (job): como "ll" argentina pero con "d" delante, "dch".',
    pairs: [['yet','jet'],['yes','Jess'],['wood','good'],['year','jeer']],
    words: ['water','work','window','job','juice','yellow'],
    twister: 'Will you wash the window with warm water?' }
];

/* Escenarios para el tutor de IA (modo libre) */
const SCENARIOS = [
  { id: 'free', icon: '💬', title: 'Charla libre', desc: 'Habla de lo que quieras', prompt: 'Have a friendly casual conversation. Ask the learner about their day, family, hobbies.' },
  { id: 'cafe', icon: '☕', title: 'Pedir en un café', desc: 'Eres cliente', prompt: 'You are a barista in a coffee shop in Miami. The learner is a customer ordering.' },
  { id: 'airport', icon: '✈️', title: 'Aeropuerto y migración', desc: 'Control de inmigración', prompt: 'You are an immigration officer at Miami airport asking routine questions (purpose of visit, length of stay, hotel).' },
  { id: 'doctor', icon: '🩺', title: 'Visita al médico', desc: 'Explica síntomas', prompt: 'You are a friendly doctor. The learner is a patient describing symptoms.' },
  { id: 'interview', icon: '💼', title: 'Entrevista de trabajo', desc: 'Practica respuestas', prompt: 'You are a hiring manager doing a job interview. Ask typical interview questions one at a time.' },
  { id: 'supplier', icon: '📦', title: 'Negociar con proveedor', desc: 'Precios, entregas, garantías', prompt: 'You are a machinery supplier from China selling agricultural equipment (pellet mills, extruders). Negotiate price, lead time, shipping and warranty.' },
  { id: 'school', icon: '🎒', title: 'En el colegio', desc: 'Para los chamos', prompt: 'You are a friendly classmate at an international school. Talk about classes, games, friends and hobbies. Keep it fun and age-appropriate.' },
  { id: 'hotel', icon: '🏨', title: 'Check-in en hotel', desc: 'Reservas y problemas', prompt: 'You are a hotel receptionist. The learner is checking in and may have a problem with the room.' }
];

/* Prueba de ubicación: frases de referencia por nivel (se toman del curso) */
