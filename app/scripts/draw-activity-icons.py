"""Original activity icons: one palette, rounded strokes, soft fills. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path(__file__).resolve().parents[1] / 'static' / 'ui' / 'activities'
INK, BLUE, MINT, GOLD, ROSE = '#376788', '#a9cde8', '#a3cfbe', '#efce87', '#e6a4aa'
S = 4

def draw_icon(name):
    im = Image.new('RGBA', (96*S, 96*S))
    d = ImageDraw.Draw(im)
    def line(points, color=INK, width=3.5):
        pts=[(round(x*S),round(y*S)) for x,y in points]
        w=round(width*S);d.line(pts,fill=color,width=w,joint='curve')
        for x,y in (pts[0],pts[-1]):d.ellipse((x-w/2,y-w/2,x+w/2,y+w/2),fill=color)
    def box(r, fill=BLUE, radius=6, outline=INK, width=3):
        d.rounded_rectangle(tuple(round(v*S) for v in r),radius=radius*S,fill=fill,outline=outline,width=round(width*S))
    def circle(x,y,r,fill=BLUE,outline=INK,width=3):
        d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill=fill,outline=outline,width=round(width*S))
    def poly(points,fill=BLUE,outline=INK):
        pts=[(x*S,y*S) for x,y in points];d.polygon(pts,fill=fill)
        if outline:line(points+[points[0]],outline,3)
    def arc(rect,start,end,color=INK,width=3):
        d.arc(tuple(v*S for v in rect),start,end,fill=color,width=round(width*S))
    box((2,2,94,94),'#eaf2fb',20,'#d5e4f3',1)
    if name=='puzzle':
        box((22,24,74,74),'#f8fbff',10);line([(31,65),(44,65),(44,38),(63,38)]);line([(55,30),(63,38),(55,46)]);circle(31,65,5,MINT)
    elif name=='light':
        poly([(31,73),(37,46),(59,46),(65,73)],BLUE);box((32,32,64,47),GOLD,4);poly([(31,31),(48,19),(65,31)],MINT);line([(48,59),(48,70)]);line([(19,30),(14,25)],width=2.5);line([(77,30),(82,25)],width=2.5)
    elif name=='numbers':
        box((22,22,74,74),'#f8fbff',10);box((26,26,47,47),MINT,4,None);box((50,50,70,70),GOLD,4,None);line([(30,36),(42,36)]);line([(36,30),(36,42)]);line([(54,36),(65,36)]);line([(31,54),(41,64)]);line([(41,54),(31,64)]);line([(54,56),(65,56)]);line([(54,63),(65,63)])
    elif name=='safety':
        poly([(48,20),(72,29),(69,56),(59,70),(48,77),(37,70),(27,56),(24,29)],MINT);line([(34,48),(44,58),(62,38)],width=4)
    elif name in ['sound','lab-sound']:
        poly([(23,39),(35,39),(49,28),(49,68),(35,57),(23,57)],BLUE);arc((43,30,71,66),-65,65);arc((45,20,83,76),-60,60);circle(26,72,4,GOLD,None)
    elif name=='spell':
        box((21,27,75,69),'#f8fbff',9);box((24,30,51,66),MINT,5,None);line([(29,59),(37,37),(45,59)]);line([(32,52),(43,52)]);line([(58,38),(67,38)]);line([(58,48),(67,48)]);line([(58,58),(64,58)])
    elif name=='mines':
        box((22,23,43,44),'#f8fbff',4);box((22,49,43,70),MINT,4);box((48,49,69,70),'#f8fbff',4);line([(56,23),(56,45)]);poly([(56,23),(76,28),(56,35)],ROSE);line([(52,44),(64,44)]);line([(30,60),(35,55),(35,65)],width=2.5)
    elif name=='tetris':
        for x,y,color in [(26,23,BLUE),(26,46,MINT),(49,46,MINT),(49,69,GOLD),(26,69,GOLD),(72,69,GOLD)]:
            box((x-10,y-10,x+10,y+10),color,4)
    elif name=='match':
        for x,y,color in [(28,30,ROSE),(66,30,GOLD),(28,66,MINT),(66,66,ROSE)]:
            circle(x,y,12,color);line([(x-4,y-5),(x,y-7)],'#f8fbff',2)
        line([(45,45),(50,50)],width=2);line([(50,45),(45,50)],width=2)
    elif name=='plane':
        poly([(48,18),(54,39),(74,55),(74,61),(54,56),(54,68),(63,75),(48,71),(33,75),(42,68),(42,56),(22,61),(22,55),(42,39)],BLUE);line([(48,34),(48,57)]);line([(29,24),(29,31)],'#81b4a5',2.5);line([(69,21),(69,29)],'#81b4a5',2.5)
    elif name=='jump':
        box((18,65,40,79),MINT,5);box((60,52,82,79),GOLD,5);box((36,26,56,42),BLUE,5);circle(42,33,2,INK,None);circle(50,33,2,INK,None);box((39,42,53,52),GOLD,3);arc((28,21,73,66),195,325,INK,2);line([(66,23),(74,23),(73,31)],width=2)
    elif name=='gomoku':
        box((22,22,74,74),'#f6e7cd',7)
        for v in [34,48,62]:
            line([(v,28),(v,68)],'#aab9b3',1.5);line([(28,v),(68,v)],'#aab9b3',1.5)
        circle(34,34,6,INK,None);circle(48,48,6,'#f8fbff',INK,2);circle(62,62,6,INK,None);circle(34,62,6,'#f8fbff',INK,2)
    elif name=='snake':
        line([(29,72),(58,72),(65,63),(65,51),(32,51),(27,42),(27,31),(42,27)],INK,17);line([(29,72),(58,72),(65,63),(65,51),(32,51),(27,42),(27,31),(42,27)],MINT,11);box((37,18,60,36),MINT,9);circle(53,24,2,INK,None);line([(60,29),(67,29)],ROSE,2);circle(73,70,7,ROSE);line([(73,62),(76,57)],width=2)
    elif name=='clock':
        circle(48,48,27,'#f8fbff');arc((23,23,73,73),-90,0,BLUE,7);line([(48,30),(48,48),(60,56)],width=4);circle(48,48,3,GOLD,None)
    elif name=='flower':
        line([(48,51),(48,78)]);poly([(48,66),(30,57),(32,71),(48,75)],MINT);poly([(48,70),(68,60),(65,75),(48,78)],MINT)
        for a in range(0,360,72):
            x=48+14*math.cos(math.radians(a-90));y=36+14*math.sin(math.radians(a-90));circle(x,y,11,ROSE,width=2)
        circle(48,36,10,GOLD,width=2)
    elif name=='lab':
        line([(39,20),(57,20)]);poly([(41,20),(41,41),(24,68),(27,76),(69,76),(72,68),(55,41),(55,20)],'#f8fbff');poly([(32,57),(64,57),(72,68),(69,76),(27,76),(24,68)],MINT,None);line([(29,76),(67,76)]);circle(45,61,4,GOLD,None);circle(57,69,3,'#f8fbff',None);circle(70,29,4,GOLD,None)
    elif name=='lab-shadow':
        circle(29,35,12,GOLD);line([(29,15),(29,19)],width=2);line([(11,35),(15,35)],width=2);line([(17,20),(20,23)],width=2);poly([(39,42),(67,56),(67,76),(29,60)],'#c9dbea',None);box((62,24,71,76),'#b4cadb',3);box((42,43,49,62),MINT,2)
    elif name=='lab-float':
        poly([(21,53),(76,53),(66,68),(31,68)],BLUE);poly([(46,25),(46,51),(68,51)],GOLD);line([(46,24),(46,54)]);line([(21,76),(31,72),(42,76),(53,72),(64,76),(76,72)],'#70a9bb',2.5)
    elif name=='lab-circuit':
        box((22,34,34,65),BLUE,4);line([(28,28),(28,34)]);line([(34,40),(48,40),(48,25),(69,25),(69,35)]);line([(69,59),(69,73),(28,73),(28,65)]);circle(69,47,13,GOLD);line([(64,61),(74,61)])
    elif name in ['lab-materials','lab-poles']:
        arc((24,23,70,70),0,180,INK,17);arc((24,23,70,70),0,180,BLUE,11);box((24,25,40,48),ROSE,3);box((54,25,70,48),MINT,3)
        if name=='lab-materials':line([(43,28),(50,22),(53,25),(46,31)],width=2.5)
        else:line([(45,25),(45,40)],width=2);line([(49,25),(49,40)],width=2)
    elif name=='lab-ramp':
        poly([(20,71),(73,42),(73,71)],MINT);box((37,28,63,44),GOLD,4);circle(43,45,5,'#f8fbff');circle(60,45,5,'#f8fbff');line([(22,78),(76,78)])
    elif name=='lab-friction':
        box((31,32,65,51),GOLD,5);circle(38,55,6,'#f8fbff');circle(60,55,6,'#f8fbff');line([(20,69),(28,65),(36,69),(44,65),(52,69),(60,65),(68,69),(76,65)],'#7095ad',3);line([(18,42),(24,42)],width=2.5)
    elif name=='lab-parachute':
        arc((20,20,76,76),180,360,INK,4);poly([(20,48),(29,28),(48,20),(67,28),(76,48)],BLUE,None);arc((20,20,76,76),180,360);line([(20,48),(76,48)]);line([(22,49),(43,72)]);line([(74,49),(53,72)]);box((41,69,55,79),GOLD,3)
    elif name=='lab-lever':
        poly([(48,48),(36,73),(60,73)],MINT);line([(20,47),(76,47)],width=4);box((23,26,39,45),GOLD,3);box((60,34,73,45),BLUE,3);line([(31,19),(31,23)],width=2)
    elif name=='lab-color':
        circle(38,36,18,ROSE,width=2);circle(59,36,18,MINT,width=2);circle(48,56,18,BLUE,width=2);circle(48,42,8,GOLD,width=2)
    elif name=='lab-pressure':
        box((21,23,48,76),'#f8fbff',4);box((25,37,44,73),BLUE,1,None);line([(48,51),(57,50),(67,55),(75,65)],'#6aabbd',3);circle(77,72,3,BLUE,None);line([(54,78),(81,78)],width=2)
    elif name=='lab-moon':
        circle(48,48,26,GOLD);circle(58,41,23,'#eaf2fb',None);circle(27,29,3,BLUE,None);line([(74,64),(74,76)],width=2);line([(68,70),(80,70)],width=2)
    else:raise ValueError(name)
    return im.resize((192,192),Image.Resampling.LANCZOS)

NAMES = ['clock','flower','lab','puzzle','light','numbers','safety','sound','spell','mines','tetris','match','plane','snake','jump','gomoku'] + ['lab-'+s for s in ['shadow','float','circuit','materials','poles','sound','ramp','friction','parachute','lever','color','pressure','moon']]
if __name__ == '__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    for name in NAMES:draw_icon(name).save(OUT/(name+'.png'),optimize=True)
