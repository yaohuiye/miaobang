"""Draw original local UI icons and safety scene illustrations; requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'static' / 'ui'
OUT.mkdir(parents=True, exist_ok=True)
S = 3

def icon(name, color, suffix=''):
    im = Image.new('RGBA', (96*S, 96*S))
    d = ImageDraw.Draw(im)
    def line(points, fill=color, width=5):
        d.line([(x*S,y*S) for x,y in points], fill=fill, width=width*S, joint='curve')
    def box(rect, fill=None, outline=color, radius=10, width=4):
        d.rounded_rectangle(tuple(v*S for v in rect), radius*S, fill=fill, outline=outline, width=width*S)
    def ellipse(rect, fill=None, outline=color, width=4):
        d.ellipse(tuple(v*S for v in rect),fill=fill,outline=outline,width=width*S)
    if name == 'home':
        line([(15,43),(48,15),(81,43)])
        line([(24,40),(24,78),(40,78),(40,57),(56,57),(56,78),(72,78),(72,40)])
    elif name == 'book':
        line([(48,29),(38,23),(15,23),(15,73),(37,73),(48,79),(59,73),(81,73),(81,23),(59,23),(48,29),(48,79)])
        line([(24,38),(36,38)],width=3); line([(60,38),(72,38)],width=3)
        line([(24,50),(36,50)],width=3); line([(60,50),(72,50)],width=3)
    elif name == 'history':
        box((22,19,76,83),radius=10); box((35,12,62,27),fill='#f4f8ff',radius=6)
        line([(33,47),(40,54),(63,37)]);line([(34,66),(63,66)],width=3)
    elif name == 'clock':
        ellipse((15,15,81,81));line([(48,28),(48,49),(62,56)])
    elif name == 'settings':
        for y,x in [(25,37),(48,62),(71,32)]:
            line([(17,y),(79,y)],width=4);ellipse((x-7,y-7,x+7,y+7),fill='#f4f8ff',width=4)
    elif name == 'puzzle':
        box((13,13,83,83),radius=15)
        line([(27,65),(45,65),(45,34),(67,34)]);line([(56,23),(67,34),(56,45)])
        ellipse((21,59,33,71),fill='#d9eee8',width=3)
    elif name == 'numbers':
        box((14,14,82,82),radius=15)
        line([(28,34),(44,34)]);line([(36,26),(36,42)]);line([(56,34),(70,34)])
        line([(29,57),(43,71)]);line([(43,57),(29,71)]);line([(56,59),(70,59)]);line([(56,68),(70,68)])
    elif name == 'safety':
        line([(48,12),(77,24),(75,54),(63,73),(48,84),(33,73),(21,54),(19,24),(48,12)])
        line([(32,48),(43,59),(65,36)])
    elif name == 'sound':
        line([(19,39),(32,39),(51,24),(51,72),(32,57),(19,57),(19,39)])
        d.arc((45*S,26*S,77*S,70*S),-65,65,fill=color,width=4*S)
        d.arc((41*S,14*S,89*S,82*S),-60,60,fill=color,width=4*S)
    elif name == 'spell':
        box((14,20,82,76),radius=15)
        line([(27,63),(38,34),(49,63)],width=4);line([(31,53),(45,53)],width=4)
        line([(59,38),(70,38)],width=3);line([(59,48),(70,48)],width=3);line([(59,58),(68,58)],width=3)
    elif name == 'light':
        line([(32,76),(37,48),(59,48),(64,76),(32,76)])
        box((32,31,64,48),fill='#fff0b9',radius=5)
        line([(31,29),(48,16),(65,29)]);line([(48,59),(48,72)])
        line([(17,29),(10,23)],width=3);line([(79,29),(86,23)],width=3)
    elif name == 'flower':
        line([(48,54),(48,85)],fill='#377965',width=4)
        ellipse((20,62,47,75),fill='#a5cfb4',outline=None)
        ellipse((50,68,77,82),fill='#76b597',outline=None)
        for rect in [(32,9,57,37),(46,23,77,49),(40,39,65,65),(18,35,48,61),(15,14,45,43)]:
            ellipse(rect,fill='#d87795',outline=None)
        ellipse((32,28,56,52),fill='#ffe6a8',outline='#fff0cc',width=2)
    im.resize((96,96),Image.Resampling.LANCZOS).save(OUT / f'{name}{suffix}.png')

for name in ['home','book','history','clock','settings','puzzle','numbers','safety','sound','spell','light','flower']:
    icon(name,'#2865a3')
for name in ['home','book','history']:
    icon(name,'#536b84','-off');icon(name,'#2165ae','-on')

def scene(name):
    im=Image.new('RGB',(640,260),'#e7f2fc');d=ImageDraw.Draw(im)
    d.ellipse((480,-45,650,125),fill='#fff3cf')
    for x,y in [(46,26),(230,44)]:
        d.rounded_rectangle((x,y,x+86,y+24),12,fill='#ffffff')
    d.rectangle((0,155,640,260),fill='#bed0df');d.rectangle((0,135,640,171),fill='#d9e9df')
    d.line((0,172,640,172),fill='#96adbd',width=3)
    for x in range(15,640,94):d.rounded_rectangle((x,219,x+44,223),2,fill='#f6f8f8')
    # A quiet tree and a raised pedestrian area establish the scene without danger animation.
    d.rounded_rectangle((65,93,75,151),3,fill='#819f9c');d.ellipse((38,62,103,120),fill='#91beac')
    if name in ['red-light','green-light','dropped-toy']:
        for x in range(305,460,29):d.polygon([(x,175),(x+16,175),(x+37,255),(x+16,255)],fill='#f6f9fc')
        d.rounded_rectangle((493,33,535,120),12,fill='#34536c');d.rectangle((511,119,518,156),fill='#34536c')
        d.ellipse((503,43,525,65),fill='#d97078' if name=='red-light' else '#5c7180')
        d.ellipse((503,82,525,104),fill='#5e9e83' if name=='green-light' else '#5c7180')
        if name=='dropped-toy':
            d.ellipse((402,190,433,221),fill='#efbd7e',outline='#956b39',width=2)
            d.arc((398,190,440,224),80,270,fill='#956b39',width=2)
    else:
        d.rounded_rectangle((276,76,555,184),19,fill='#508bc1',outline='#34628b',width=3)
        for x in [292,355,418]:d.rounded_rectangle((x,89,x+49,129),7,fill='#d8ebf5')
        d.rounded_rectangle((486,90,536,173),7,fill='#d4e7f0');d.line((511,94,511,173),fill='#34628b',width=3)
        d.rounded_rectangle((291,144,469,150),3,fill='#f4db9f')
        for x in [324,504]:d.ellipse((x-18,168,x+18,204),fill='#34536c');d.ellipse((x-8,178,x+8,194),fill='#c1d6e4')
        if name=='bus-stop' or name=='missed-stop':
            d.rounded_rectangle((172,52,213,109),8,fill='#fff',outline='#6791ad',width=3);d.rectangle((190,109,195,155),fill='#6791ad')
            d.rounded_rectangle((181,66,203,90),4,fill='#5587b2')
        if name=='parking':
            d.rounded_rectangle((164,48,210,106),7,fill='#3e79af');d.line((181,92,181,63,198,63,198,77,181,77),fill='#fff',width=4)
        if name=='on-bus':
            for x in [315,378,441]:d.line((x,90,x,111),fill='#628da8',width=3);d.ellipse((x-6,108,x+6,120),outline='#628da8',width=3)
    # Two companions stay together on the pavement, away from the road.
    for x,h,color in [(130,48,'#316da8'),(162,36,'#d79861')]:
        d.ellipse((x-8,143-h-19,x+8,143-h-3),fill='#e5b991')
        d.rounded_rectangle((x-10,143-h,x+10,141),6,fill=color)
        d.line((x-5,139,x-5,155),fill='#39546d',width=4);d.line((x+5,139,x+5,155),fill='#39546d',width=4)
    if name in ['on-bus','missed-stop']:
        im=Image.new('RGB',(640,260),'#e3eff8');d=ImageDraw.Draw(im)
        d.rectangle((0,210,640,260),fill='#bdcfdf')
        for x in [40,240,440]:
            d.rounded_rectangle((x,30,x+155,130),12,fill='#c3e0ef',outline='#8eafc6',width=3)
            d.rectangle((x+4,104,x+151,126),fill='#b7d4c5')
        d.line((20,20,620,20),fill='#7d9bb3',width=6)
        d.line((366,20,366,232),fill='#7d9bb3',width=6)
        for x in [92,283,475]:
            d.line((x,20,x,51),fill='#7d9bb3',width=3);d.rounded_rectangle((x-12,50,x+12,68),6,outline='#6388a5',width=4)
        d.rounded_rectangle((150,119,220,205),12,fill='#508bc1');d.rounded_rectangle((137,181,235,210),9,fill='#508bc1')
        # A seated child and an accompanying adult holding the fixed rail.
        d.ellipse((168,99,193,124),fill='#e5b991');d.rounded_rectangle((160,126,202,179),9,fill='#d79861')
        d.line((180,175,213,184,217,227),fill='#39546d',width=11)
        d.ellipse((296,67,330,101),fill='#e5b991');d.rounded_rectangle((287,103,337,176),10,fill='#316da8')
        d.line((299,171,296,229),fill='#39546d',width=9);d.line((327,171,333,229),fill='#39546d',width=9)
        d.line((332,116,365,108),fill='#316da8',width=11);d.ellipse((357,100,372,114),fill='#e5b991')
    im.save(OUT/f'scene-{name}.png',optimize=True)
for name in ['red-light','green-light','bus-stop','on-bus','after-bus','dropped-toy','parking','missed-stop']:scene(name)
