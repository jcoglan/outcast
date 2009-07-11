module Outcast
  VERSION = '0.1.0'
end

%w[itunes server].each do |file|
  require File.dirname(__FILE__) + '/outcast/' + file
end
