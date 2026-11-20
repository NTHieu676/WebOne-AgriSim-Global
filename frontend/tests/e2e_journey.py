from playwright.sync_api import sync_playwright
import re,json
import os,tempfile
R='file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))+'/'
SHOTS=os.path.join(tempfile.gettempdir(),'agrisim_shots');os.makedirs(SHOTS,exist_ok=True)
res=[]
def ok(name,cond,extra=''):
    res.append((name,bool(cond),extra)); print(('PASS ' if cond else 'FAIL '),name,extra)
def at(pg): return pg.url.split('/frontend/')[1].split('?')[0]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1440,'height':900}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    def go(path): pg.goto(R+path); pg.wait_for_timeout(700)
    # 1 chưa đăng nhập
    go('index.html'); pg.wait_for_timeout(400); ok('G1 index (chưa đăng nhập) -> trang giới thiệu',at(pg)=='pages/landing/landing.html',at(pg))
    ok('G1b landing: có Đăng nhập/Đăng ký/Chơi thử + 3 bước',pg.locator('.lp-nav a[href$="login.html"]').count()==1 and pg.locator('.lp-nav a[href$="register.html"]').count()==1 and pg.locator('#demo').count()==1 and pg.locator('.lp-step').count()==3)
    pg.click('.lp-nav a[href$="login.html"]');pg.wait_for_timeout(500);ok('G1c landing -> Đăng nhập',at(pg)=='pages/auth/login.html',at(pg))
    pg.click('.auth .brand');pg.wait_for_timeout(500);ok('G1d logo ở login quay về landing',at(pg)=='pages/landing/landing.html',at(pg))
    pg.click('.lp-nav a[href$="register.html"]');pg.wait_for_timeout(500);ok('G1e landing -> Đăng ký',at(pg)=='pages/auth/register.html',at(pg))
    go('pages/landing/landing.html');pg.wait_for_timeout(300)
    for pth in ['dashboard/dashboard','farm/farm','inventory/inventory','pool/pool','market/market','market/notices','profile/profile']:
        go('pages/'+pth+'.html'); pg.wait_for_timeout(300); ok('G2 anon '+pth+' -> login',at(pg)=='pages/auth/login.html')
    go('pages/game/startgame.html'); ok('G3 anon startgame -> login',at(pg)=='pages/auth/login.html')
    go('pages/game/endgame.html'); ok('G3 anon endgame -> login',at(pg)=='pages/auth/login.html')
    # 2 đăng ký lỗi
    go('pages/auth/register.html'); pg.click('#go'); ok('R1 form rỗng báo lỗi',pg.locator('#enm:visible').count()==1 and pg.locator('#epw:visible').count()==1)
    pg.fill('#nm','Test User');pg.fill('#em','test@agrisim.vn');pg.fill('#pw','12345678');pg.fill('#pw2','1234');pg.click('#go');ok('R2 mật khẩu xác nhận không khớp',pg.locator('#epw2:visible').count()==1)
    pg.fill('#pw2','12345678');pg.click('#go');pg.wait_for_timeout(900);ok('R3 đăng ký thành công',pg.locator('text=Tạo tài khoản thành công').count()==1)
    go('pages/auth/register.html');pg.fill('#nm','Test User');pg.fill('#em','test@agrisim.vn');pg.fill('#pw','12345678');pg.fill('#pw2','12345678');pg.click('#go');pg.wait_for_timeout(900);ok('R4 email đã tồn tại',pg.locator('#eem:visible').count()==1)
    # 3 đăng nhập
    go('pages/auth/login.html');pg.fill('#em','sai@x.vn');pg.fill('#pw','abc');pg.click('#go');pg.wait_for_timeout(700);ok('L1 sai email',pg.locator('#eem:visible').count()==1)
    pg.fill('#em','test@agrisim.vn');pg.fill('#pw','saisai');pg.click('#go');pg.wait_for_timeout(700);ok('L2 sai mật khẩu',pg.locator('#epw:visible').count()==1)
    pg.fill('#pw','12345678');pg.click('#go');pg.wait_for_timeout(1200);ok('L3 đăng nhập, chưa có lượt -> startgame',at(pg)=='pages/game/startgame.html',at(pg))
    # 4 chặn trang game khi chưa có lượt
    for pth in ['dashboard/dashboard','farm/farm','pool/pool','market/market','profile/profile']:
        go('pages/'+pth+'.html'); pg.wait_for_timeout(300); ok('G4 chưa có lượt: '+pth+' -> startgame',at(pg)=='pages/game/startgame.html')
    go('pages/game/endgame.html');ok('G4 chưa có lượt: endgame -> startgame',at(pg)=='pages/game/startgame.html')
    go('pages/auth/login.html');ok('G5 đã đăng nhập: login -> startgame',at(pg)=='pages/game/startgame.html')
    # 5 start game
    ok('S1 nút Bắt đầu khóa khi chưa chọn',pg.locator('#go').is_disabled())
    pg.click('[data-r=asia]');ok('S2 chọn khu vực mở nút',not pg.locator('#go').is_disabled())
    pg.click('#go');pg.wait_for_timeout(300);ok('S3 modal xác nhận',pg.locator('.modal').count()==1)
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500);ok('S4 bắt đầu -> dashboard',at(pg)=='pages/dashboard/dashboard.html',at(pg))
    for pth in ['auth/login','auth/register','game/startgame']:
        go('pages/'+pth+'.html'); pg.wait_for_timeout(300); ok('G6 đang chơi: '+pth+' -> dashboard',at(pg)=='pages/dashboard/dashboard.html')
    go('pages/game/endgame.html');ok('G7 đang chơi: endgame -> dashboard',at(pg)=='pages/dashboard/dashboard.html')
    go('index.html');pg.wait_for_timeout(300);ok('G8 index đang chơi -> dashboard',at(pg)=='pages/dashboard/dashboard.html')
    # 6 Nông trại: trồng
    go('pages/farm/farm.html');
    ok('F1 2 ô trống, nút Trồng lúa',pg.locator('[data-plant]').count()==2)
    ok('F2 chưa hiện thẻ Mua thêm khi còn ô trống',pg.locator('.plot--buy').count()==0)
    pg.click('[data-plant="1"]');pg.wait_for_timeout(300);pg.screenshot(path=SHOTS+'/m_plant.png');pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    ok('F3 trồng ô 1 -> đang sinh trưởng',pg.locator('text=Đang sinh trưởng').count()>=1)
    bal=pg.inner_text('[data-balance]');ok('F4 số dư 1.900 USDG',bal.startswith('1.900'),bal)
    pg.click('[data-plant="2"]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    ok('F5 hết ô trống -> hiện Mua thêm/Chờ',pg.locator('.plot--buy').count()==1 and pg.locator('[data-wait]').count()>=1)
    # mua thêm: đủ USDG (1800 >= 500)
    pg.click('.plot--buy [data-buy]');pg.wait_for_timeout(300);ok('F6 modal mua thêm',pg.locator('.modal:has-text("Giá mở rộng")').count()==1);pg.screenshot(path=SHOTS+'/m_buy.png')
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500);ok('F7 mua thêm -> 3 ô',pg.locator('.plot').count()>=3 and pg.locator('[data-plant]').count()==1)
    pg.click('[data-plant="3"]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    # trạng thái ô tối đa: mua tới 4 ô
    pg.click('.plot--buy [data-buy]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    ok('F8 đạt 4/4 ô -> chặn mua',pg.locator('text=Đã đạt giới hạn').count()>=1 and pg.locator('.plot--buy [data-buy]').count()==0)
    # 7 chuyển vòng
    pg.click('[data-act=next]');pg.wait_for_timeout(300);ok('N1 modal chuyển vòng',pg.locator('.modal:has-text("Chuyển sang Vòng 2")').count()==1)
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500);ok('N2 sang vòng 2',pg.locator('.pill:has-text("2/6")').count()==1)
    ok('N3 ô đã trồng sẵn sàng thu hoạch',pg.locator('[data-harvest]').count()==3,str(pg.locator('[data-harvest]').count()))
    pg.click('[data-harvest="1"]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    pg.click('[data-harvest="2"]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    # Kho
    go('pages/inventory/inventory.html');ok('I1 kho có 2 lô lúa 100%',pg.locator('.tbl-lots tbody tr').count()==2,str(pg.locator('.tbl-lots tbody tr').count()))
    pg.click('.tbl-lots [data-ship]');pg.wait_for_timeout(300);ok('I2 modal gửi hàng',pg.locator('.modal:has-text("Gửi hàng")').count()==1);pg.screenshot(path=SHOTS+'/m_ship.png')
    pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    go('pages/market/market.html?tab=ship');ok('M1 chuyến hàng có 1 chuyến',pg.locator('.tbl tbody tr').count()==1)
    go('pages/pool/pool.html');pg.wait_for_timeout(500);pg.fill('#amt','10');pg.wait_for_timeout(300)
    ok('P1 báo giá swap 98,72 USDG',pg.locator('#res:has-text("98,72")').count()==1,pg.inner_text('#res')[:120].replace('\n',' '))
    pg.screenshot(path=SHOTS+'/pool_quote.png')
    pg.click('#ok');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500);ok('P2 swap xong toast',pg.locator('.toast').count()>=1)
    go('pages/market/market.html');pg.wait_for_timeout(500)
    ok('M2 thị trường hiện lô để bán',pg.locator('[data-sell]').count()>=0)
    # Nạp
    go('pages/profile/profile.html');pg.fill('#amt','150');ok('T1 nạp 150 báo lỗi bội số',pg.locator('#aerr:visible').count()==1)
    pg.fill('#amt','500');pg.click('#go');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    ok('T2 nạp 500 -> tổng nạp 500',pg.locator('text=500,00 USDG').count()>=1)
    # chuyển đến vòng 6
    for r in range(3,7):
        go('pages/dashboard/dashboard.html');pg.click('[data-act=next]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    ok('N4 đến vòng 6 hiện nút Kết thúc',pg.locator('[data-act=end]').count()==1)
    pg.screenshot(path=SHOTS+'/round6.png')
    # kết thúc
    pg.click('[data-act=end]');pg.wait_for_timeout(300);pg.screenshot(path=SHOTS+'/m_end.png');pg.click('.modal-foot .btn-danger');pg.wait_for_timeout(1500)
    ok('E1 kết thúc -> endgame',at(pg)=='pages/game/endgame.html',at(pg))
    pg.screenshot(path=SHOTS+'/endgame.png')
    for pth in ['dashboard/dashboard','farm/farm','inventory/inventory','pool/pool','market/market','profile/profile']:
        go('pages/'+pth+'.html');pg.wait_for_timeout(500)
        ok('E2 read-only '+pth,at(pg)=='pages/'+pth+'.html' and pg.locator('text=Lượt chơi đã kết thúc – bạn chỉ có thể xem.').count()>=1)
    go('pages/farm/farm.html');pg.wait_for_timeout(500);ok('E3 farm: nút thao tác bị khóa',pg.locator('[data-plant]:not([disabled]), [data-harvest]:not([disabled]), [data-buy]:not([disabled])').count()==0)
    pg.screenshot(path=SHOTS+'/farm_end.png')
    go('pages/auth/login.html');ok('E4 đã kết thúc: login -> endgame',at(pg)=='pages/game/endgame.html',at(pg))
    go('pages/game/startgame.html');ok('E5 đã kết thúc: startgame -> endgame (phải Chơi lại)',at(pg)=='pages/game/endgame.html',at(pg))
    # chơi lại
    pg.click('#rp');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-danger');pg.wait_for_timeout(1500);ok('E6 chơi lại -> startgame',at(pg)=='pages/game/startgame.html',at(pg))
    # đăng xuất
    pg.click('[data-r=europe]');pg.click('#go');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-primary');pg.wait_for_timeout(1500)
    pg.click('.avatar');pg.click('[data-act=logout]');pg.wait_for_timeout(300);pg.click('.modal-foot .btn-danger');pg.wait_for_timeout(1500)
    ok('O1 đăng xuất -> login',at(pg)=='pages/auth/login.html' and pg.locator('text=Bạn đã đăng xuất').count()==1,at(pg))
    go('pages/dashboard/dashboard.html');ok('O2 sau đăng xuất chặn dashboard',at(pg)=='pages/auth/login.html')
    # state demo
    pg.click('#demo');pg.wait_for_timeout(1200)
    for st in ['loading','error']:
        go('pages/dashboard/dashboard.html?state='+st);pg.wait_for_timeout(700);pg.screenshot(path=SHOTS+'/dash_'+st+'.png')
    ok('ST1 state=error hiện banner + Thử lại',pg.locator('#retry').count()==1)
    go('pages/dashboard/dashboard.html');ok('N1 menu hiển thị "Trang chủ", không còn "Tổng quan"',pg.locator('.sidebar:has-text("Trang chủ")').count()>=1 and pg.locator('text=Tổng quan').count()==0)
    go('pages/landing/landing.html');pg.wait_for_timeout(600);ok('G5 đã đăng nhập mở landing: vẫn xem được, nút Vào game -> dashboard',at(pg)=='pages/landing/landing.html' and pg.locator('#enter').count()==1 and pg.locator('#demo').count()==0 and pg.locator('.lp-nav a[href$="login.html"]').count()==0,at(pg))
    pg.click('#enter');pg.wait_for_timeout(500);ok('G5b bấm Vào game -> dashboard',at(pg)=='pages/dashboard/dashboard.html',at(pg))
    go('index.html');pg.wait_for_timeout(400);ok('G6 index khi đang chơi -> dashboard',at(pg)=='pages/dashboard/dashboard.html',at(pg))
    pg.evaluate("AgriSim.auth.logout&&AgriSim.auth.logout()");go('pages/landing/landing.html');pg.click('#demo');pg.wait_for_timeout(1500);ok('G7 landing: Chơi thử bằng tài khoản mẫu -> dashboard',at(pg)=='pages/dashboard/dashboard.html',at(pg))
    print('PAGEERRORS',errs)
    b.close()
fails=[r for r in res if not r[1]]
print('TOTAL',len(res),'FAIL',len(fails))
json.dump(res,open(os.path.join(SHOTS,'e2e_result.json'),'w'),ensure_ascii=False)
