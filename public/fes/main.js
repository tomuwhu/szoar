var globals = {
  lw: { jog: 0 },
  jogsz : { j0 : "nincs bejelentkezve", j1 : "diák", j2 : "tanár", j4 : "adminisztrátor", j6 : "admintanár" },
  napnev : { Mon : "Hétfő",  Tue : "Kedd",    Wed : "Szerda",  Thu : "Csütörtök",
             Fri : "Péntek", Sat : "Szombat", Sun : "Vasárnap" }
}
//routes
angular.module('ngView', ['ngRoute'],
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
          templateUrl: 'ps1', templateName: 'Kezdőlap',
          controller: KezdolapCntl, controllerAs: 'p1'
        })
        $routeProvider.when('/logout', {
          templateUrl: 'ps1', templateName: 'Kezdőlap',
          controller: KezdolapCntl, controllerAs: 'p1'
        })
        $routeProvider.when('/admin/firstconfig', {
          templateUrl: 'a_fc', templateName: 'Adminisztráció: beállítás',
          controller: FirstcfgCntl, controllerAs: 'fc'
        })
        $routeProvider.when('/admin/targyak', {
          templateUrl: 'a_targyak', templateName: 'Adminisztráció: tárgyak',
          controller: AdminCntl,    controllerAs: 'a'
        })
        $routeProvider.when('/admin/oktatok', {
          templateUrl: 'a_oktatok', templateName: 'Adminisztráció: oktatók',
          controller: AdminCntl,    controllerAs: 'a'
        })
        $routeProvider.when('/admin/hallgatok', {
          templateUrl: 'a_hallgatok', templateName: 'Adminisztráció: hallgatók',
          controller: AdminCntl,    controllerAs: 'a'
        })
        $routeProvider.when('/admin/idopontok', {
          templateUrl: 'a_idopontok', templateName: 'Adminisztráció: időpontok',
          controller: AdminCntl,    controllerAs: 'a'
        })
        $routeProvider.when('/login', {
          templateUrl: 'log', templateName: 'Bejelentkezési ablak',
          controller: LoginwindowCntl, controllerAs: 'lw'
        })
        $routeProvider.otherwise('/')
        $locationProvider.html5Mode(true)
    }
)
//controllers
function MainCntl($route, $routeParams, $location, $scope, $http, $interval) {
  $scope.logout = () => {
      $http .get("/session/destroy")
            .then( res => {
                globals.lw = res.data
                $location.path( "/logout" )
             })
  }
  sessrefresh = () => {
    $http .get("/session")
          .then( res => {
              if (res.data.jog>0) {
                  globals.lw = res.data
              }
           })
  }
  gettingstarted = () => {
    $http .get("/getst")
          .then( res => {
              $scope.nau=res.data.nau
           })
  }
  $scope.$on('$viewContentLoaded', () => {
      $scope.msg = $route.current.templateName + ' betöltve.'
      $scope.jog = globals.lw.jog
      $scope.jogsz = globals.jogsz["j"+globals.lw.jog.toString()]
  })
  $interval(sessrefresh, 100000)
  sessrefresh()
  gettingstarted()
}
function FirstcfgCntl($http, $location, $scope) { //fc
  this.submit = () => {
     $http .post("/firstconfig",this.af)
           .then( res => {
               if (res.data._id) {
                   globals.lw = res.data
                   $scope.nau = false
                   $location.path( "/" )
               }
            } )
  }
}
function AdminCntl($routeParams,$http,$filter,$scope) {
  this.lw = globals.lw, this.name = "Adminisztráció"
  this.uip = { osz: 8 }
  this.oleny = {}
  this.dleny = {}
  $http.get("/oktlist").then( res => {
      if (typeof res.data[0] !== 'undefined') this.oktatok = res.data
      else this.oktatok = []
  } )
  $http.get("/diaklist").then( res => {
      if (typeof res.data[0] !== 'undefined') this.diakok = res.data
      else this.diakok = []
  } )
  $http.get("/targylist").then( res => {
      if (typeof res.data[0] !== 'undefined') this.targyak = res.data
      else this.targyak = []
  } )
  $http.get("/iplist").then(res => {
        this.eho = {}
        if (typeof res.data[0] !== 'undefined') this.ipl = res.data
        else this.ipl = []
        this.ipl.forEach( (d,k) => {
            this.eho["h"+$filter('date')(d.idate, "yy-MM")]=$filter('date')(d.idate, "yy-MM")
            this.szurd = $filter('date')(d.idate, "yy-MM")
            if (!d.oszrow) d.oszrow = d.osz
            d.nap = globals.napnev[$filter('date')(d.idate, "EEE", "+0000")]
        })
        this.szurlist=Object.values(this.eho)
        if (this.szurlist.length>1) this.vanszurlist=true
        else this.vanszurlist=false
  })
  this.ujoktfelv = () => {
      $http.post("/ujoktato",this.ujokt).then(res => {
          this.oktatok.push(res.data)
          this.oktatok.sort( ( a, b ) => ( +(a.nev > b.nev) || +(a.nev === b.nev) - 1 ) )
          this.ujokt = {}
      })
  }
  this.ujdiakfelv = () => {
      $http.post("/ujdiak",this.ujdiak).then(res => {
          this.diakok.push(res.data)
          this.diakok.sort( ( a, b ) => ( +(a.nev > b.nev) || +(a.nev === b.nev) - 1 ) )
          this.ujdiak = {}
      })
  }
  this.szf = (date) => ( $filter('date')(date, "yy-MM") == this.szurd )
  this.utf = (utc) => {
      $http.post("/ujtargy",utc).then(res => {
          this.targyak.push(res.data)
          this.targyak.sort( ( a, b ) => ( +(a.tnev > b.tnev) || +(a.tnev === b.tnev) - 1 ) )
          $scope.ut = {}
      })
  }
  this.uipf = (uip) => {
      if (typeof this.eho !== "object") this.eho = {}
      ujrek = uip
      ujrek.oszrow=uip.osz
      ujrek.oktid=""
      ujrek.targyid=""
      $http.post("/ujip", ujrek).then( res => {
          qt = res.data
          this.eho["h"+$filter('date')(qt.idate, "yy-MM")]=$filter('date')(qt.idate, "yy-MM")
          this.szurlist = Object.values(this.eho)
          if (this.szurlist.length>1) this.vanszurlist=true
          else this.vanszurlist=false
          this.szurd = $filter('date')(qt.idate, "yy-MM")
          this.szurlist.sort( (a,b) => ( +(a > b) || +(a === b) - 1 ))
          qt.nap = globals.napnev[$filter('date')(qt.idate, "EEE", "+0000")]
          this.ipl.push(qt)
          this.ipl.sort( ( a, b ) => (
            parseInt($filter('date')(a.idate, "yyyyMMdd", "+0000"))-parseInt($filter('date')(b.idate, "yyyyMMdd", "+0000")) )
          )
      } )
  }
  this.ipt = (rk,id) => {
      $http.post("/delip", {tid: id}).then( res => {
          if (res.data.jo==1) this.ipl.splice(rk,1)
          this.eho = {}
          this.szurlist = []
          dn = ""
          this.ipl.forEach( (d,k) => {
              this.eho["h"+$filter('date')(d.idate, "yy-MM")]=$filter('date')(d.idate, "yy-MM")
              dn = $filter('date')(d.idate, "yy-MM")
              if (!d.oszrow) d.oszrow = d.osz
              d.nap = globals.napnev[$filter('date')(d.idate, "EEE", "+0000")]
          })
          this.szurlist=Object.values(this.eho)
          if (this.szurlist.length>1) this.vanszurlist=true
          else {
              this.vanszurlist=false
              this.szurd = dn
          }
      } )
  }
  this.setokt = (ipid,oktid) => {
      $http.post("/ipsetokt", {ipid, oktid}).then( res => {
          //igazolást feldolgozni!!
          //console.log(res.data)
      } )
  }
  this.settargy = (ipid,targyid) => {
      $http.post("/ipsettargy", {ipid, targyid}).then( res => {
          //igazolást feldolgozni!!
          //console.log(res.data)
      } )
  }
  this.chtn = (kulcs) => {
        $http.post("/targymod",this.targyak[kulcs]).then(res => {
            if (res.data.jo==1) this.targyak[kulcs].lg=false
        })
  }
  this.lag = (kulcs) => {
      this.targyak[kulcs].lg=true
  }
  this.lag2 = (id,osz) => {
      $http.post("/ipnoszmod",{id,osz}).then(res => {
          //igazolást feldolgozni!!
          //console.log(res.data)
      })
  }
  this.lag3 = (id,osz) => {
      $http.post("/ipaoszmod",{id,osz}).then(res => {
          //igazolást feldolgozni!!
          //console.log(res.data)
      })
  }
  this.deltargyokt = (key,id) => {
      $http.post("/deltargyokt", {id}).then( res => {
          if (res.data.jo==1) {
              this.ipl[key].targyid=""
              this.ipl[key].oktid=""
          }
      } )
  }
  this.params = $routeParams
}
function KezdolapCntl($routeParams) {
  this.lw = globals.lw
}
function LoginwindowCntl($routeParams,$http,$interval,$location,$scope) {
  this.deletealert = () => this.wp=false
  this.sendlogin = () => {
      $http .post("/session",this.fd)
            .then( res => {
                if (res.data.wp) {
                    this.wp=true
                    $interval(this.deletealert, 3000, 1)
                }
                if (res.data._id) {
                    globals.lw = res.data
                    $location.path( "/" )
                }
             } )
  }
}
