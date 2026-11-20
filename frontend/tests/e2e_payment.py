from playwright.sync_api import sync_playwright
import json
import os,tempfile
R='file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))+'/'
SHOTS=os.path.join(tempfile.gettempdir(),'agrisim_shots');os.makedirs(SHOTS,exist_ok=True)
res=[]
def ok(n,c,x=''):
    res.append((n,bool(c),x));print('PASS ' if c else 'FAIL ',n,x)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(R+'pages/auth/login.html');pg.wait_for_timeout(500)
    pg.click('#demo');pg.wait_for_timeout(1500)
    def bal(): return pg.evaluate("AgriSim.store.peek().usdg")
    def openpay(a):
        pg.goto(R+'pages/profile/profile.html');pg.wait_for_timeout(900)
        pg.fill('#amt',str(a));pg.click('#go');pg.wait_for_timeout(400)
    b0=bal();ok('P0 số dư demo',b0==1785,str(b0))
    # nhập sai số tiền không mở cổng
    openpay(150);ok('P1 150 (không bội 100) bị chặn, không mở cổng',pg.locator('.pay').count()==0 and pg.locator('#aerr:visible').count()==1)
    # QR thành công
    openpay(500);ok('P2 mở cổng, bước 1 chọn phương thức',pg.locator('.pay-opt').count()==3 and pg.locator('.pay-steps li.on:has-text("Phương thức")').count()==1)
    pg.screenshot(path=SHOTS+'/pay1_method.png')
    pg.click('#payNext');pg.wait_for_timeout(800)
    ok('P3 hiện mã QR + mã GD + đếm ngược',pg.locator('.qr-box svg').count()==1 and pg.locator('#qrClock').inner_text()[:2]=='05' and pg.locator('text=AGRISIM AGS').count()==1)
    ok('P3b chưa cộng tiền khi chưa thanh toán',bal()==b0)
    pg.screenshot(path=SHOTS+'/pay2_qr.png')
    pg.click('#payDone');pg.wait_for_timeout(1200)
    ok('P4 thành công: hiện kết quả + số dư mới',pg.locator('.pay-result.ok').count()==1 and bal()==b0+500,str(bal()))
    pg.screenshot(path=SHOTS+'/pay3_ok.png')
    pg.click('#payFin');pg.wait_for_timeout(900)
    ok('P5 đóng cổng, trang cập nhật số dư',pg.locator('.pay').count()==0 and '2.285' in pg.locator('.bigmoney').inner_text())
    ok('P5b có dòng lịch sử + danh sách giao dịch nạp',pg.locator('#payList .badge:has-text("Thành công")').count()==1)
    # QR thất bại giả lập
    openpay(100);pg.click('#payNext');pg.wait_for_timeout(700);pg.click('[data-sim=failed]');pg.wait_for_timeout(900)
    ok('P6 thất bại: không cộng tiền, có Thử lại',pg.locator('.pay-result.bad').count()==1 and bal()==b0+500)
    pg.screenshot(path=SHOTS+'/pay4_fail.png')
    pg.click('#payRetry');pg.wait_for_timeout(300);ok('P6b Thử lại quay về chọn phương thức',pg.locator('.pay-opt').count()==3)
    # hết hạn thật (rút ngắn TTL)
    pg.evaluate("AgriSim.CFG.qrTtlSec=2");pg.click('#payNext');pg.wait_for_timeout(3600)
    ok('P7 QR hết hạn tự chuyển trạng thái, không cộng tiền',pg.locator('.pay-result.bad').count()==1 and pg.locator('text=hết hạn').count()>0 and bal()==b0+500)
    pg.evaluate("AgriSim.CFG.qrTtlSec=300");pg.click('#payClose');pg.wait_for_timeout(700)
    # đóng khi đang chờ = hủy
    openpay(200);pg.click('#payNext');pg.wait_for_timeout(600);pg.keyboard.press('Escape');pg.wait_for_timeout(700)
    st=pg.evaluate("AgriSim.store.payments()[0].status");ok('P8 Esc khi đang chờ -> đơn bị hủy',st=='cancelled' and bal()==b0+500,st)
    # thẻ: sai OTP rồi đúng
    openpay(300);pg.click('[data-m=card]');pg.select_option('#bank','GreenBank');pg.click('#payNext');pg.wait_for_timeout(700)
    ok('P9 thẻ: hiện form OTP',pg.locator('#pCode').count()==1)
    pg.screenshot(path=SHOTS+'/pay5_card.png')
    pg.click('#payDone');ok('P9b để trống bị báo lỗi',pg.locator('#pErr:visible').count()==1)
    pg.fill('#pCode','111111');pg.click('#payDone');pg.wait_for_timeout(200);ok('P9c sai OTP báo còn 2 lần',pg.locator('#pErr:has-text("Còn 2")').count()==1)
    pg.fill('#pCode','123456');pg.click('#payDone');pg.wait_for_timeout(1200)
    ok('P10 đúng OTP -> thành công +300',pg.locator('.pay-result.ok').count()==1 and bal()==b0+800 and pg.locator('text=GreenBank').count()>0,str(bal()))
    pg.click('#payFin');pg.wait_for_timeout(800)
    # ví: sai PIN 3 lần -> thất bại
    openpay(100);pg.click('[data-m=wallet]');ok('P11 ví: ẩn chọn ngân hàng',pg.locator('#bankField:visible').count()==0)
    pg.click('#payNext');pg.wait_for_timeout(700)
    for i in range(3):
        pg.fill('#pCode','000000');pg.click('#payDone');pg.wait_for_timeout(700)
    ok('P12 sai PIN 3 lần -> thất bại, không cộng',pg.locator('.pay-result.bad').count()==1 and bal()==b0+800)
    pg.click('#payClose');pg.wait_for_timeout(600)
    # đổi phương thức giữa chừng hủy đơn cũ
    openpay(100);pg.click('#payNext');pg.wait_for_timeout(600);pg.click('#payBack');pg.wait_for_timeout(500)
    ok('P13 đổi phương thức quay về bước 1',pg.locator('.pay-opt').count()==3);pg.keyboard.press('Escape');pg.wait_for_timeout(500)
    # chống cộng 2 lần
    r=pg.evaluate("""async()=>{const o=await AgriSim.api.createPayment({amount:100,method:'qr',bank:'AgriBank'});await AgriSim.api.settlePayment(o.id,'success');
      try{await AgriSim.api.settlePayment(o.id,'success');return 'dup-ok'}catch(e){return e.code}}""")
    ok('P14 chống cộng tiền 2 lần cùng 1 đơn',r=='ALREADY_PAID' and bal()==b0+900,r+' '+str(bal()))
    # từ luồng mua mảnh đất thiếu tiền -> nạp -> quay lại
    pg.evaluate("(()=>{const k='agrisim.db.v1';const d=JSON.parse(localStorage.getItem(k));const e=Object.keys(d.games)[0];d.games[e].usdg=300;d.games[e].plots[1]={id:2,status:'growing',plantedRound:3,readyRound:4};localStorage.setItem(k,JSON.stringify(d));})()")
    pg.goto(R+'pages/farm/farm.html');pg.wait_for_timeout(900);pg.click('.plot--buy [data-buy]');pg.wait_for_timeout(500)
    pg.screenshot(path=SHOTS+'/pay6_f4a.png')
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(500)   # Nạp USDG
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(500)   # Tiếp tục (số tiền)
    ok('P15 F4: thiếu tiền -> mở quy trình thanh toán',pg.locator('.pay-opt').count()==3)
    pg.click('#payNext');pg.wait_for_timeout(700);pg.click('#payDone');pg.wait_for_timeout(1200);pg.click('#payFin');pg.wait_for_timeout(1300)
    ok('P16 F4: nạp xong tự mở lại bước mua đất',pg.locator('.modal:has-text("Giá mở rộng")').count()==1,str(bal()))
    # chế độ chỉ-đọc
    pg.evaluate("AgriSim.store.endGame()");pg.wait_for_timeout(600);pg.goto(R+'pages/profile/profile.html');pg.wait_for_timeout(900)
    ok('P17 game kết thúc: nút Nạp bị khóa',pg.locator('#go[disabled]').count()==1)
    # mobile
    m=b.new_context(viewport={'width':390,'height':844}).new_page()
    m.goto(R+'pages/auth/login.html');m.wait_for_timeout(500);m.click('#demo');m.wait_for_timeout(1500)
    m.goto(R+'pages/profile/profile.html');m.wait_for_timeout(900);m.click('#go');m.wait_for_timeout(400);m.click('#payNext');m.wait_for_timeout(800)
    m.screenshot(path=SHOTS+'/pay7_mobile.png')
    ow=m.evaluate("[document.querySelector('.pay').scrollWidth,document.querySelector('.pay').clientWidth]");ok('P18 mobile: cổng không tràn ngang',ow[0]<=ow[1],str(ow))
    ok('NO PAGE ERRORS',not errs,str(errs))
print('TOTAL',len(res),'FAIL',sum(1 for r in res if not r[1]))
json.dump(res,open(os.path.join(SHOTS,'pay_result.json'),'w'),ensure_ascii=False)
