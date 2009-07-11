Hub = new JS.Class({
  initialize: function(comet) {
    this._comet = comet;
    this._channels = new JS.SortedSet([]);
    
    this._channelList = Ojay('#channels div');
    this._artistList  = Ojay('#libraryView .artists ul');
    this._albumList   = Ojay('#libraryView .albums ul');
    this._trackList   = Ojay('#libraryView .tracks');
    
    this._comet.subscribe('/all/newchannel', this.method('_newChannel'));
    this.setupLoginForm();
  },
  
  setupLoginForm: function() {
    this._loginForm = Ojay('#login form');
    this._loginForm.on('submit', function(form, evnt) {
      evnt.stopDefault();
      this.loadLibrary(Ojay.Forms.getData(form));
    }, this);
  },
  
  loadLibrary: function(params) {
    this._libraryName    = params.libraryName;
    this._libraryAddress = params.libraryAddress;
    Ojay.HTTP.GET(this._libraryAddress, {jsonp: 'callback'}, function(data) {
      
      this._artists = data.artists.reduce(function(set, artist) {
        set.add(artist);
        return set;
      }, new JS.SortedSet([]) );
      
      this._albums = data.albums.reduce(function(set, album) {
        set.add(album);
        return set;
      }, new JS.SortedSet([]) );
      
      this._tracks = data.tracks.reduce(function(set, track) {
        set.add(new Hub.Track(track));
        return set;
      }, new JS.SortedSet([]) );
      
      this._comet.publish('/all/newchannel', {name: this._libraryName});
      Ojay('#login').hide();
      
      this.refreshLibraryView();
    }.bind(this));
  },
  
  _newChannel: function(channel) {
    if (channel.name === this._libraryName) return;
    this._channels.add(channel.name);
    this.refreshChannelList();
  },
  
  refreshChannelList: function() {
    var channels = this._channels;
    this._channelList.setContent( Ojay.HTML.ul(function(h) {
      channels.forEach(h.method('li'));
    }) );
  },
  
  refreshLibraryView: function() {
    this._artistList.setContent('');
    this._artists.forEach(function(artist) {
      var link = Ojay( Ojay.HTML.a({href: '#'}, artist) );
      this._artistList.insert(Ojay.HTML.li(link.node));
      link.on('click', Ojay.stopDefault)._(this).filterByArtist(artist);
    }, this);
    
    this._albumList.setContent('');
    this._albums.forEach(function(album) {
      var link = Ojay( Ojay.HTML.a({href: '#'}, album) );
      this._albumList.insert(Ojay.HTML.li(link.node));
      link.on('click', Ojay.stopDefault)._(this).filterByAlbum(album);
    }, this);
    
    var tracks = this._tracks;
    this._trackList.setContent( Ojay.HTML.table(function(h) {
      h.thead(
        h.tr(
          h.td({className: 'artist'}, 'Artist'),
          h.td({className: 'album'}, 'Album'),
          h.td({className: 'track'}, 'Track No.'),
          h.td({className: 'name'}, 'Name')
        )
      );
      var body = Ojay(h.tbody());
      tracks.forEach(function(track) { body.insert(track.getHTML()) });
    }) );
  },
  
  filterByArtist: function(artist) {
    this._tracks.forEach(function(track) {
      track[ track.artist === artist ? 'show' : 'hide' ]();
    });
  },
  
  filterByAlbum: function(album) {
    this._tracks.forEach(function(track) {
      track[ track.album === album ? 'show' : 'hide' ]();
    });
  },
  
  extend: {
    Track: new JS.Class({
      include: JS.Comparable,
      
      extend: {
        compareItems: function(one, other, property) {
          var a = one[property], b = other[property];
          return (a === b) ? 0 : (a < b ? -1 : 1);
        }
      },
      
      initialize: function(data) {
        JS.extend(this, data);
      },
      
      compareTo: function(other) {
        var c = this.klass.compareItems;
        return c(this, other, 'artist') ||
               c(this, other, 'album') ||
               c(this, other, 'trackNo');
      },
      
      getHTML: function() {
        if (this._html) return this._html;
        var self = this;
        
        this._html = Ojay( Ojay.HTML.tr(function(h) {
          h.td({className: 'artist'}, self.artist);
          h.td({className: 'album'}, self.album);
          h.td({className: 'track'}, String(self.trackNo));
          h.td({className: 'name'}, self.name);
        }) );
        
        return this._html;
      },
      
      show: function() { this.getHTML().show() },
      
      hide: function() { this.getHTML().hide() }
    }) 
  }
});
